"""Browser checks against a running dev or preview server (no mocked navigation)."""
import io
import os
from pathlib import Path
import re
import shutil
import unittest

from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIT_TEST_URL', 'http://127.0.0.1:4173').rstrip('/')
ENTRY = BASE if BASE.endswith('.html') else BASE + '/'
SCREENS = re.findall(r"id: '([^']+)', source: (\d+), height: ([\d.]+)", (ROOT / 'src/screens.ts').read_text())


class SiteSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        browser_path = os.environ.get('FIT_BROWSER_PATH') or shutil.which('chromium')
        cls.browser = cls.pw.chromium.launch(headless=True, **({'executable_path': browser_path} if browser_path else {}))

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 900})
        self.page = self.context.new_page()
        self.page.set_default_timeout(5000)
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.on('response', lambda response: self.errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def open(self, screen='home'):
        self.page.goto(f'{ENTRY}#{screen}')
        self.wait(screen)

    def wait(self, screen):
        self.page.wait_for_selector(f'[data-screen="{screen}"]')
        self.page.wait_for_function("document.querySelector('.artwork')?.complete && document.querySelector('.artwork')?.naturalWidth === 1920")

    def click(self, label, screen):
        self.page.get_by_role('button', name=label, exact=True).click()
        self.wait(screen)

    def test_all_25_screens_fit_desktop_and_phone_without_scroll(self):
        self.assertEqual(len(SCREENS), 25)
        for width, height in ((1440, 900), (375, 812), (390, 844), (844, 390)):
            self.page.set_viewport_size({'width': width, 'height': height})
            for screen, _, source_height in SCREENS:
                with self.subTest(screen=screen, viewport=(width, height)):
                    self.open(screen)
                    box = self.page.locator('.screen').bounding_box()
                    self.assertGreaterEqual(box['x'], -0.1)
                    self.assertGreaterEqual(box['y'], -0.1)
                    self.assertLessEqual(box['x'] + box['width'], width + 0.1)
                    self.assertLessEqual(box['y'] + box['height'], height + 0.1)
                    self.assertAlmostEqual(box['width'] / box['height'], 1320 / float(source_height), delta=0.002)
                    sizes = self.page.evaluate('({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})')
                    self.assertEqual(sizes, {'w': width, 'h': height})

    def test_every_defined_transition_and_contextual_back(self):
        count = 0
        for screen, _, _ in SCREENS:
            self.open(screen)
            destinations = self.page.locator('button[data-to]').evaluate_all('(buttons) => buttons.map(b => b.dataset.to)')
            for target in destinations:
                with self.subTest(source=screen, target=target):
                    self.open(screen)
                    self.page.locator(f'button[data-to="{target}"]').first.click()
                    self.wait(target)
                    self.click('Назад', screen)
                    count += 1
        print(f'\nVerified {count} button transitions and their return paths.')
        self.assertGreater(count, 25)

    def test_every_screen_reachable_from_home_using_buttons(self):
        pending = [('home', [])]
        visited = set()
        while pending:
            screen, path = pending.pop(0)
            if screen in visited:
                continue
            self.open('home')
            for target in path:
                self.page.locator(f'button[data-to="{target}"]').first.click()
                self.wait(target)
            self.assertEqual(self.page.locator('.screen').get_attribute('data-screen'), screen)
            visited.add(screen)
            for target in self.page.locator('button[data-to]').evaluate_all('(buttons) => buttons.map(b => b.dataset.to)'):
                if target not in visited:
                    pending.append((target, path + [target]))
        self.assertEqual(visited, {screen for screen, _, _ in SCREENS})

    def test_history_refresh_and_home(self):
        self.open()
        self.click('Выездной интерактив', 'events')
        self.click('Подробнее: мини-коврики для гостей', 'mini')
        self.click('Стоимость', 'event-price')
        self.click('Что входит в стоимость', 'turnkey')
        self.page.reload()
        self.wait('turnkey')
        self.click('Назад', 'event-price')
        self.click('Назад', 'mini')
        self.click('Главная', 'home')
        self.assertTrue(self.page.get_by_role('button', name='Назад', exact=True).is_disabled())
        self.assertTrue(self.page.get_by_role('button', name='Главная', exact=True).is_disabled())
        self.click('О нас', 'about')
        self.page.go_back()
        self.wait('home')
        self.page.go_forward()
        self.wait('about')

    def test_keyboard_and_no_automatic_slide_changes(self):
        self.open()
        self.page.keyboard.press('Tab')
        self.assertEqual(self.page.locator(':focus').get_attribute('aria-label'), 'Выездной интерактив')
        self.page.keyboard.press('Enter')
        self.wait('events')
        for key in ('ArrowRight', 'ArrowDown', 'PageDown', 'Space'):
            self.page.keyboard.press(key)
        self.page.mouse.wheel(0, 1200)
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.locator('.screen').get_attribute('data-screen'), 'events')

    def test_right_edge_sequence_and_terminal_screens(self):
        self.open('timing')
        self.click('Следующий слайд', 'four-hours')
        self.click('Следующий слайд', 'booking')
        for terminal in ('guest', 'company', 'equipment', 'shared-gallery-3', 'mini-gallery', 'composite-gallery', 'booking', 'contacts'):
            self.open(terminal)
            self.assertEqual(self.page.get_by_role('button', name='Следующий слайд', exact=True).count(), 0)

    def test_requested_right_edge_transitions_from_their_branches(self):
        cases = [
            ([('Ковёр для бигбосса', 'boss'), ('Следующий слайд', 'boss-result'), ('Стоимость', 'boss-price')], 'contacts'),
            ([('Выездной интерактив', 'events'), ('Подробнее: большой общий ковёр', 'shared'), ('Стоимость', 'event-price'), ('Что входит в стоимость', 'turnkey')], 'booking'),
            ([('О нас', 'about'), ('Мастер-классы в студии', 'workshops')], 'contacts'),
            ([('О нас', 'about'), ('Ковры на заказ', 'custom')], 'contacts'),
        ]
        for path, destination in cases:
            with self.subTest(source=path[-1][1], destination=destination):
                self.open()
                for label, screen in path:
                    self.click(label, screen)
                box = self.page.locator('.screen').bounding_box()
                self.page.mouse.click(box['x'] + box['width'] * 0.97, box['y'] + box['height'] * 0.5)
                self.wait(destination)
                self.click('Назад', path[-1][1])

    def test_contact_destinations_and_unknown_route(self):
        for screen in ('contacts', 'booking'):
            self.open(screen)
            expected = {
                'Сайт студии': 'https://taftingstudio.ru',
                'Telegram студии': 'https://t.me/koversMK',
                'Instagram студии': 'https://www.instagram.com/zabeykover?igsh=MX',
                'Позвонить: 8-915-181-87-90': 'tel:+79151818790',
            }
            for label, href in expected.items():
                link = self.page.get_by_role('link', name=label, exact=True)
                self.assertEqual(link.get_attribute('href'), href)
                if href.startswith('https:'):
                    self.assertEqual(link.get_attribute('target'), '_blank')
                    self.assertIn('noopener', link.get_attribute('rel'))
        self.page.goto(f'{ENTRY}#missing-screen')
        self.wait('home')

    def test_mobile_touch_and_rotation(self):
        mobile = self.browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=3)
        page = mobile.new_page()
        try:
            page.goto(ENTRY)
            page.wait_for_selector('[data-screen="home"]')
            page.get_by_role('button', name='Ковёр для бигбосса', exact=True).tap()
            page.wait_for_selector('[data-screen="boss"]')
            page.set_viewport_size({'width': 844, 'height': 390})
            page.get_by_role('button', name='Следующий слайд', exact=True).tap()
            page.wait_for_selector('[data-screen="boss-result"]')
            page.get_by_role('button', name='Назад', exact=True).tap()
            page.wait_for_selector('[data-screen="boss"]')
        finally:
            mobile.close()

    def test_artwork_fidelity(self):
        for screen, source, height in (SCREENS[0], SCREENS[1]):
            self.page.set_viewport_size({'width': 1920, 'height': 1080})
            self.open(screen)
            rendered = Image.open(io.BytesIO(self.page.locator('.screen').screenshot())).convert('RGB')
            artwork = Image.open(ROOT / f'public/screens/{source}.webp').convert('RGB')
            self.assertEqual(rendered.size, artwork.size)
            delta = sum(ImageStat.Stat(ImageChops.difference(rendered, artwork)).mean) / 3
            self.assertLess(delta, 2, f'Artwork changed: average channel difference {delta}')

    def test_one_click_opens_every_screen_when_original_images_are_unavailable(self):
        # Simulate a connection that can load the app but cannot download the
        # large artwork files. Navigation must still work after exactly one click.
        self.page.route('**/screens/*.webp', lambda route: route.abort())
        self.page.goto(ENTRY)
        self.page.wait_for_selector('[data-screen="home"]')
        pending = [('home', [])]
        visited = set()
        while pending:
            screen, path = pending.pop(0)
            if screen in visited:
                continue
            if self.page.locator('.screen').get_attribute('data-screen') != 'home':
                self.page.get_by_role('button', name='Главная', exact=True).click()
            for target in path:
                # The destination and its controls must exist in the same
                # JavaScript task as the click, with no network/decode await.
                result = self.page.locator(f'button[data-to="{target}"]').first.evaluate(
                    "button => { button.click(); return document.querySelector('.screen').dataset.screen; }"
                )
                self.assertEqual(result, target)
            self.page.wait_for_function("document.querySelector('.artwork')?.naturalWidth === 960")
            self.assertEqual(self.page.locator('.screen').get_attribute('data-screen'), screen)
            visited.add(screen)
            for target in self.page.locator('button[data-to]').evaluate_all('(buttons) => buttons.map(b => b.dataset.to)'):
                if target not in visited:
                    pending.append((target, path + [target]))
        self.assertEqual(visited, {screen for screen, _, _ in SCREENS})

    def test_slow_original_does_not_delay_click_or_overwrite_a_newer_screen(self):
        self.open()
        held = []
        self.page.route('**/screens/22.webp', lambda route: held.append(route))
        self.page.get_by_role('button', name='Ковёр для бигбосса', exact=True).click()
        self.page.wait_for_selector('[data-screen="boss"]', timeout=500)
        self.page.wait_for_function("document.querySelector('.artwork')?.naturalWidth === 960")
        self.assertEqual(len(held), 1)
        self.page.get_by_role('button', name='Следующий слайд', exact=True).click()
        self.wait('boss-result')
        with self.page.expect_response(lambda response: response.url.endswith('/screens/22.webp')):
            held[0].continue_()
        self.page.wait_for_function("document.querySelector('#app').getAttribute('aria-busy') === 'false'")
        self.assertEqual(self.page.locator('.screen').get_attribute('data-screen'), 'boss-result')

    def test_single_mobile_taps_inside_tilda_iframe_with_images_blocked(self):
        mobile = self.browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        try:
            mobile.route('**/screens/*.webp', lambda route: route.abort())
            page = mobile.new_page()
            page.set_content(f'<iframe title="Забей ковёр" src="{ENTRY}" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>')
            frame = page.frame_locator('iframe')
            frame.locator('[data-screen="home"]').wait_for()
            for label, screen in (
                ('Выездной интерактив', 'events'),
                ('Подробнее: большой общий ковёр', 'shared'),
                ('Стоимость', 'event-price'),
                ('Что входит в стоимость', 'turnkey'),
                ('Следующий слайд', 'booking'),
                ('Назад', 'turnkey'),
                ('Главная', 'home'),
            ):
                frame.get_by_role('button', name=label, exact=True).tap()
                frame.locator(f'[data-screen="{screen}"]').wait_for(timeout=500)
            page.set_viewport_size({'width': 844, 'height': 390})
            frame.get_by_role('button', name='Ковёр для бигбосса', exact=True).tap()
            frame.locator('[data-screen="boss"]').wait_for(timeout=500)
        finally:
            mobile.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
