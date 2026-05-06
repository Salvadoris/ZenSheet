import { generateUuid } from '../../../utils/uuid';
import {
  ChangableRectangleDrawingProperties,
  RectangleDrawingProperties,
} from '../DrawingProperties/RectangleDrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { RectangleShape } from '../Shapes/RectangleShape';
import { Shape } from '../Shapes/Shape';
import { RectangleStyle } from '../ShapeStyles/RectangleStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class RectangleDrawing extends Drawing {
  declare properties: RectangleDrawingProperties;

  override get style(): RectangleStyle {
    return this.properties[FormPropertyName.style];
  }

  toShape(): Shape {
    return new RectangleShape(
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

  update(p: Point): ChangableRectangleDrawingProperties {
    const properties: ChangableRectangleDrawingProperties = {};
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
    const lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.lineWidth = lineWidth;
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.fillStyle = this.style[StyleName.BackgroundColor];

    const path = new Path2D();
    path.rect(this.originX, this.originY, this.width, this.height);

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
