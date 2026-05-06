import { generateUuid } from '../../../utils/uuid';
import {
  ChangableStraightLineDrawingProperties,
  StraightLineDrawingProperties,
} from '../DrawingProperties/StraightLineDrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { Shape } from '../Shapes/Shape';
import { StraightLineShape } from '../Shapes/StraightLineShape';
import { StraightLineStyle } from '../ShapeStyles/StraightLineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class StraightLineDrawing extends Drawing {
  declare properties: StraightLineDrawingProperties;

  override get style(): StraightLineStyle {
    return this.properties[FormPropertyName.style];
  }

  path(): Path2D {
    const path = new Path2D();
    path.moveTo(this.originX, this.originY);
    path.lineTo(this.originX + this.width, this.originY + this.height);
    return path;
  }

  toShape(): Shape {
    return new StraightLineShape(
      {
        [FormPropertyName.id]: generateUuid(),
        [FormPropertyName.style]: this.style,
        [FormPropertyName.originX]: this.originX,
        [FormPropertyName.originY]: this.originY,
        [FormPropertyName.originalWidth]: this.width,
        [FormPropertyName.originalHeight]: this.height,
        [FormPropertyName.edited]: false,
        [FormPropertyName.selected]: false,
      },
      this.bufferCtx
    );
  }

  update(p: Point): ChangableStraightLineDrawingProperties {
    const properties: ChangableStraightLineDrawingProperties = {};
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
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.stroke(this.path());

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
