// Settings: Profile, Notifications, Security (real password change) and Billing (no card inputs). Fresh mocks.
const { launch, signUpAndAddKey, base, SB, ok, section, warm, results, PW } = require('./lib');

(async () => {
  await warm(['/sign-up', '/settings']);
  const { browser, page, errors } = await launch();
  const email = await signUpAndAddKey(page, 'settings');
  const NEWPW = 'a-brand-new-password-99';

  await section('profile', async () => {
    await page.goto(base + '/settings', { waitUntil: 'networkidle' });
    ok('profile: shows the real sign-in e-mail (read-only)', (await page.inputValue('#p-email')) === email && (await page.isDisabled('#p-email')));
    await page.fill('#p-first', 'Ann'); await page.fill('#p-last', 'Author'); await page.fill('#p-company', 'Acme'); await page.fill('#p-website', 'javascript:alert(1)');
    await page.click('button:has-text("Save changes")');
    await page.waitForSelector('[data-testid=profile-status][role=alert]');
    ok('profile: an invalid website is rejected by the server with a field error', /highlighted/.test(await page.innerText('[data-testid=profile-status]')) && (await page.locator('#p-website + [role=alert]').count()) === 1);
    await page.fill('#p-website', 'https://acme.example');
    await page.click('button:has-text("Save changes")');
    await page.waitForSelector('[data-testid=profile-status][role=status]');
    const st = await (await fetch(SB + '/__state')).json();
    const row = st.user_settings.find((r) => JSON.stringify(r).includes('Acme'));
    ok('profile: saved to user_settings (server-side, owner row)', !!row && row.settings.profile.firstName === 'Ann' && row.settings.profile.website === 'https://acme.example');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#p-first')?.value === 'Ann');
    ok('profile: values survive a reload (loaded from the account)', (await page.inputValue('#p-company')) === 'Acme' && (await page.inputValue('#p-website')) === 'https://acme.example');
    ok('profile: saving the profile did not wipe the OpenAI key/model settings', (await page.evaluate(async () => (await (await fetch('/api/settings/openai-key')).json()).configured)) === true);
  });

  await section('notifications', async () => {
    await page.getByRole('tab', { name: /Notifications/ }).click();
    await page.waitForFunction(() => { const el = document.querySelector('#n-marketing'); return el && !el.hasAttribute('disabled'); }, null, { timeout: 30000 }); // toggles are disabled until the profile has loaded
    await page.locator('#n-marketing').click();
    await page.locator('#n-productUpdates').click();
    await page.click('button:has-text("Save preferences")');
    await page.waitForSelector('[data-testid=notifications-status][role=status]');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: /Notifications/ }).click();
    await page.waitForFunction(() => document.querySelector('#n-marketing')?.getAttribute('data-state') === 'checked');
    ok('notifications: toggles persist (marketing on, product updates off) after a reload', (await page.locator('#n-productUpdates').getAttribute('data-state')) === 'unchecked');
    ok('notifications: the card says plainly that e-mail is not sent yet', /does not send e-mail yet/.test(await page.innerText('body')));
  });

  await section('security', async () => {
    await page.getByRole('tab', { name: /Security/ }).click();
    await page.fill('#s-current', 'wrong-current-password'); await page.fill('#s-new', NEWPW); await page.fill('#s-confirm', NEWPW);
    await page.click('button:has-text("Update password")');
    await page.waitForSelector('[data-testid=security-status][role=alert]');
    ok('security: a wrong current password is refused', /current password is not correct/.test(await page.innerText('[data-testid=security-status]')));
    await page.fill('#s-current', PW + '-long'); await page.fill('#s-new', 'short'); await page.fill('#s-confirm', 'short');
    await page.click('button:has-text("Update password")');
    ok('security: a new password under 12 characters is refused', /at least 12/.test(await page.innerText('[data-testid=security-status]')));
    await page.fill('#s-new', NEWPW); await page.fill('#s-confirm', 'different-password-99');
    await page.click('button:has-text("Update password")');
    ok('security: mismatched confirmation is refused', /do not match/.test(await page.innerText('[data-testid=security-status]')));
    await page.fill('#s-confirm', NEWPW);
    await page.click('button:has-text("Update password")');
    await page.waitForSelector('[data-testid=security-status][role=status]');
    ok('security: the password is changed', /Password updated/.test(await page.innerText('[data-testid=security-status]')));
    // prove it: sign out, the old password fails, the new one works
    await page.evaluate(() => { document.cookie.split(';').forEach((c) => { document.cookie = c.split('=')[0].trim() + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'; }); });
    await page.goto(base + '/login', { waitUntil: 'networkidle' });
    await page.fill('#email', email); await page.fill('#password', PW + '-long'); await page.click('button[type=submit]');
    await page.waitForSelector('[data-testid=auth-error]');
    ok('security: the OLD password no longer signs in', /do not match/.test(await page.innerText('[data-testid=auth-error]')));
    await page.fill('#password', NEWPW); await page.click('button[type=submit]');
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
    ok('security: the NEW password signs in', true);
  });

  await section('billing', async () => {
    await page.goto(base + '/settings', { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: /Billing/ }).click();
    await page.waitForSelector('[data-testid=billing-note]');
    const inputs = await page.locator('[role=tabpanel][data-state=active] input').count();
    ok('billing: no card/CVV/zip inputs; an honest BYOK note instead', inputs === 0 && /never asks for card details/.test(await page.innerText('[data-testid=billing-note]')) && !/Card Number|CVV|Update Billing/i.test(await page.innerText('body')));
  });

  ok('settings: no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} FAILED` : '\nAll settings checks passed');
  process.exit(failed ? 1 : 0);
})();
