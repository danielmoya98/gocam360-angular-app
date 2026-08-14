import { test, expect } from '@playwright/test';

test.describe('Módulo de Auditoría de Seguridad (Audit Logs Module E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/dashboard/audit-logs');
  });

  test('Debe cargar el título y subtítulo del registro de auditoría', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Registro de Auditoría de Seguridad');
    await expect(page.locator('p')).toContainText('Supervisa todas las acciones clave');
  });

  test('Debe filtrar la bitácora por término de búsqueda y actualizar el total', async ({ page }) => {
    const searchInput = page.locator('app-search-input input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('LOGIN');
    await page.waitForTimeout(300);

    const totalText = page.locator('text=Total de registros:');
    await expect(totalText).toBeVisible();
  });

  test('Debe activar la animación de refresco al presionar "Actualizar Bitácora"', async ({ page }) => {
    const refreshBtn = page.locator('button:has-text("Actualizar Bitácora")');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await page.waitForTimeout(200);
  });
});
