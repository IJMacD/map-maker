/**
 * Draws a rounded rectangle using the current state of the canvas.
 * @note calls `beginPath()`
 * @ref https://stackoverflow.com/a/3368118
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x The top left x coordinate
 * @param {number} y The top left y coordinate
 * @param {number} width The width of the rectangle
 * @param {number} height The height of the rectangle
 * @param {number} radius The corner radius
 */
export function roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }