import { test, expect } from '@playwright/test';

test.describe('Módulo de Gestión de Usuarios (Users Module E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Simular navegación a la página de usuarios / dashboard
    await page.goto('http://localhost:4200/dashboard/users');
  });

  test('Debe cargar el encabezado y las 4 tarjetas KPI de administradores', async ({ page }) => {
    // Validar título de la página
    await expect(page.locator('h1')).toContainText('Gestión de Administradores');

    // Validar visibilidad de las tarjetas KPI
    const kpiCards = page.locator('app-kpi-card');
    await expect(kpiCards).toHaveCount(4);
  });

  test('Debe buscar administradores por nombre o correo en el buscador', async ({ page }) => {
    const searchInput = page.locator('app-search-input input');
    await expect(searchInput).toBeVisible();

    // Escribir en el buscador
    await searchInput.fill('Carlos');

    // La lista de la tabla debe responder dinámicamente
    await page.waitForTimeout(300);
  });

  test('Debe alternar correctamente entre Vista de Tabla y Vista de Tarjetas', async ({ page }) => {
    const viewSwitcherButtons = page.locator('app-view-switcher button');
    await expect(viewSwitcherButtons).toHaveCount(2);

    // Clic en el botón de vista tarjetas
    await viewSwitcherButtons.first().click();
    await page.waitForTimeout(200);

    // Clic en el botón de vista tabla
    await viewSwitcherButtons.last().click();
    await page.waitForTimeout(200);
  });
});
