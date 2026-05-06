import { generateUuid } from '../../../utils/uuid';
import {
  ChangableLineDrawingProperties,
  LineDrawingProperties,
} from '../DrawingProperties/LineDrawingProperties';
import { FormPropertyName } from '../FormProperties/FormPropertyName';
import { Point, Rect } from '../Geometry';
import { LinePoints } from '../ShapeProperties/LineShapeProperties';
import { LineShape } from '../Shapes/LineShape';
import { Shape } from '../Shapes/Shape';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Drawing } from './Drawing';

export class LineDrawing extends Drawing {
  declare properties: LineDrawingProperties;
  #path = new Path2D();
  #pathPointsCount = 0;

  constructor(
    properties: LineDrawingProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    super(properties, bufferCtx);
    this.#path.moveTo(this.points[0][0], this.points[0][1]);
    for (let i = 1; i < this.points.length; i++) {
      this.#path.lineTo(this.points[i][0], this.points[i][1]);
    }
    this.#pathPointsCount = this.points.length;
  }

  get points() {
    return this.properties[FormPropertyName.points];
  }

  set points(points: LinePoints) {
    this.properties[FormPropertyName.points] = points;
  }

  override get style(): LineStyle {
    return this.properties[FormPropertyName.style];
  }

  toShape(): Shape {
    return new LineShape(
      {
        [FormPropertyName.id]: generateUuid(),
        [FormPropertyName.style]: this.style,
        [FormPropertyName.originX]: this.originX,
        [FormPropertyName.originY]: this.originY,
        [FormPropertyName.originalWidth]: this.width,
        [FormPropertyName.originalHeight]: this.height,
        [FormPropertyName.points]: this.points.map((p): Point => {
          return [p[0] - this.originX, p[1] - this.originY];
        }) as LinePoints,
        [FormPropertyName.edited]: false,
        [FormPropertyName.selected]: false,
      },
      this.bufferCtx
    );
  }

  update(p: Point): ChangableLineDrawingProperties {
    this.points.push([p[0], p[1]]);
    const properties: ChangableLineDrawingProperties = {
      [FormPropertyName.points]: { lastPoint: [p[0], p[1]] },
    };
    const halflineWidth = this.style[StyleName.LineWidth];
    if (p[0] - halflineWidth < this.originX) {
      this.properties[FormPropertyName.width] =
        this.originX + this.width - (p[0] - halflineWidth);
      this.properties[FormPropertyName.originX] = p[0] - halflineWidth;
      properties[FormPropertyName.width] = this.width;
      properties[FormPropertyName.originX] = this.originX;
    }
    if (p[0] + halflineWidth > this.originX + this.width) {
      this.properties[FormPropertyName.width] =
        p[0] + halflineWidth - this.originX;
      properties[FormPropertyName.width] = this.width;
    }
    if (p[1] - halflineWidth < this.originY) {
      this.properties[FormPropertyName.height] =
        this.originY + this.height - (p[1] - halflineWidth);
      this.properties[FormPropertyName.originY] = p[1] - halflineWidth;
      properties[FormPropertyName.height] = this.height;
      properties[FormPropertyName.originY] = this.originY;
    }
    if (p[1] + halflineWidth > this.originY + this.height) {
      this.properties[FormPropertyName.height] =
        p[1] + halflineWidth - this.originY;
      properties[FormPropertyName.height] = this.height;
    }
    this.#path.lineTo(p[0], p[1]);
    return properties;
  }

  render(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    if (this.#pathPointsCount !== this.points.length) {
      this.#path = new Path2D();
      this.#path.moveTo(this.points[0][0], this.points[0][1]);
      for (let i = 1; i < this.points.length; i++) {
        this.#path.lineTo(this.points[i][0], this.points[i][1]);
      }
      this.#pathPointsCount = this.points.length;
    }

    this.bufferCtx.save();
    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.lineJoin = 'round';
    this.bufferCtx.stroke(this.#path);
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
