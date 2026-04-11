import { CursorPosition } from "../../services/canvas-connection.service";

export interface RemoteCursor {
  clientId: string;
  cursorPosition: CursorPosition
  targetCursorPosition: CursorPosition;
  color: string;
  label: string;
}

/**
 * Generate a consistent color from a client ID using hash
 */
export function getColorFromClientId(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function getClientLabel(clientId: string): string {
  return clientId.substring(0, 4);
}

export function renderRemoteCursor(
  ctx: CanvasRenderingContext2D,
  cursor: RemoteCursor,
  scale: number
): void {
  const { cursorPosition, color, label } = cursor;

  ctx.save();

  // Cursor shadow
  ctx.shadowBlur = 4 / scale;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowOffsetX = 2 / scale;
  ctx.shadowOffsetY = 2 / scale;

  // Cursor pointer
  const size = 18 / scale;
  ctx.beginPath();
  ctx.moveTo(cursorPosition.x, cursorPosition.y);
  ctx.lineTo(cursorPosition.x, cursorPosition.y + size);
  ctx.lineTo(cursorPosition.x + size * 0.25, cursorPosition.y + size * 0.75);
  ctx.lineTo(cursorPosition.x + size * 0.45, cursorPosition.y + size * 1.2);
  ctx.lineTo(cursorPosition.x + size * 0.65, cursorPosition.y + size * 1.1);
  ctx.lineTo(cursorPosition.x + size * 0.45, cursorPosition.y + size * 0.65);
  ctx.lineTo(cursorPosition.x + size * 0.75, cursorPosition.y + size * 0.65);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5 / scale;
  ctx.stroke();

  // Reset shadow for text
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Label Badge
  const fontSize = 11 / scale;
  ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", sans-serif`;
  const textMetrics = ctx.measureText(label);
  const paddingX = 6 / scale;
  const paddingY = 3 / scale;
  const labelX = cursorPosition.x + size * 0.5;
  const labelY = cursorPosition.y + size * 1.3;
  const rectW = textMetrics.width + paddingX * 2;
  const rectH = fontSize + paddingY * 2;
  const radius = 4 / scale;

  // Badge Background
  ctx.beginPath();
  ctx.roundRect(labelX, labelY, rectW, rectH, radius);
  ctx.fillStyle = color;
  ctx.fill();

  // Badge Border
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.5 / scale;
  ctx.stroke();

  // Badge Text
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, labelX + paddingX, labelY + rectH / 2 + 0.5 / scale);

  ctx.restore();
}

export function renderOffScreenIndicator(
  ctx: CanvasRenderingContext2D,
  cursor: RemoteCursor,
  origin: [number, number],
  scale: number,
  width: number,
  height: number
): void {
  const { cursorPosition, color, label } = cursor;
  
  const screenX = cursorPosition.x * scale + origin[0];
  const screenY = cursorPosition.y * scale + origin[1];
  const margin = 20;
  
  if (
    screenX >= margin && 
    screenX <= width - margin && 
    screenY >= margin && 
    screenY <= height - margin
  ) {
    return;
  }

  const edgeX = Math.max(margin, Math.min(width - margin, screenX));
  const edgeY = Math.max(margin, Math.min(height - margin, screenY));

  ctx.save();
  ctx.translate(edgeX, edgeY);

  const angle = Math.atan2(screenY - edgeY, screenX - edgeX);
  ctx.rotate(angle);

  const arrowSize = 18;
  ctx.beginPath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;

  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize * 0.7, 0);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();

  ctx.rotate(-angle);

  const fontSize = 11;
  ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", sans-serif`;
  const textMetrics = ctx.measureText(label);
  const paddingX = 6;
  const paddingY = 3;
  const rectW = textMetrics.width + paddingX * 2;
  const rectH = fontSize + paddingY * 2;
  
  let labelX = 0;
  let labelY = 0;

  const labelOffset = arrowSize * 0.6;
  if (edgeX < width / 2) {
    labelX = labelOffset;
  } else {
    labelX = -rectW - labelOffset;
  }

  if (edgeY < height / 2) {
    labelY = labelOffset;
  } else {
    labelY = -rectH - labelOffset;
  }

  const radius = 4;
  ctx.beginPath();
  ctx.roundRect(labelX, labelY, rectW, rectH, radius);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, labelX + paddingX, labelY + rectH / 2 + 0.5);

  ctx.restore();
}
