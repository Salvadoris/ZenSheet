import { generateUuid } from '../../../utils/uuid';
import {
  ChangableEllipseDrawingProperties,
  EllipseDrawingProperties,
} from '../DrawingProperties/EllipseDrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { EllipseShape } from '../Shapes/EllipseShape';
import { Shape } from '../Shapes/Shape';
import { EllipseStyle } from '../ShapeStyles/EllipseStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class EllipseDrawing extends Drawing {
  declare properties: EllipseDrawingProperties;

  override get style(): EllipseStyle {
    return this.properties[FormPropertyName.style];
  }

  toShape(): Shape {
    return new EllipseShape(
      {
        [FormPropertyName.id]: generateUuid(),
        [FormPropertyName.style]: this.style,
        [FormPropertyName.originX]: Math.min(
          this.originX,
          this.originX + this.width
        ),
        [FormPropertyName.originY]: Math.min(
          this.originY,
          this.originY + this.height
        ),
        [FormPropertyName.originalWidth]: Math.abs(this.width),
        [FormPropertyName.originalHeight]: Math.abs(this.height),
        [FormPropertyName.edited]: false,
        [FormPropertyName.selected]: false,
      },
      this.bufferCtx
    );
  }

  update(p: Point): ChangableEllipseDrawingProperties {
    const properties: ChangableEllipseDrawingProperties = {};
    const newWidth = p[0] - this.originX;
    if (newWidth !== this.width) {
      this.properties[FormPropertyName.width] = newWidth;
      properties[FormPropertyName.width] = newWidth;
    }
    const newHeight = p[1] - this.originY;
    if (newHeight !== this.height) {
      this.properties[FormPropertyName.height] = newHeight;
      properties[FormPropertyName.height] = newHeight;
    }
    return properties;
  }

  render(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    this.bufferCtx.save();
    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.fillStyle = this.style[StyleName.BackgroundColor];

    const radiusX = Math.abs(this.width / 2);
    const radiusY = Math.abs(this.height / 2);
    const centerX = this.originX + this.width / 2;
    const centerY = this.originY + this.height / 2;

    const path = new Path2D();
    path.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

    this.bufferCtx.fill(path);
    this.bufferCtx.stroke(path);
    this.bufferCtx.restore();

    ctx.save();
    ctx.globalAlpha = this.style[StyleName.Opacity];
    ctx.drawImage(this.bufferCtx.canvas, 0, 0);
    ctx.restore();

    this.bufferCtx.clearRect(
      canvasRect[0],
      canvasRect[1],
      canvasRect[2] - canvasRect[0],
      canvasRect[3] - canvasRect[1]
    );
  }
}
