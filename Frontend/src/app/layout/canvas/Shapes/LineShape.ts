import { Point, Rect } from '../Geometry';
import {
  Chunk,
  LinePoints,
  LineShapeProperties,
  Segment,
} from '../ShapeProperties/LineShapeProperties';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { LineStyle } from '../ShapeStyles/LineStyle';
import { ShapeStyle, ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';

import { Shape } from './Shape';

export class LineShape extends Shape {
  declare protected _properties: Required<LineShapeProperties>;
  private chunks: Chunk[] = [];
  private segments: Segment[] = [];

  constructor(
    properties: LineShapeProperties,
    bufferCtx: CanvasRenderingContext2D
  ) {
    if (
      properties[ShapePropertyName.originX] === undefined ||
      properties[ShapePropertyName.originY] === undefined ||
      properties[ShapePropertyName.originalWidth] === undefined ||
      properties[ShapePropertyName.originalHeight] === undefined
    ) {
      const originX = minX(
        properties[ShapePropertyName.points],
        properties[ShapePropertyName.style][StyleName.LineWidth]
      );
      const originY = minY(
        properties[ShapePropertyName.points],
        properties[ShapePropertyName.style][StyleName.LineWidth]
      );
      properties[ShapePropertyName.originX] = originX;
      properties[ShapePropertyName.originY] = originY;
      properties[ShapePropertyName.originalWidth] =
        maxX(
          properties[ShapePropertyName.points],
          properties[ShapePropertyName.style][StyleName.LineWidth]
        ) - properties[ShapePropertyName.originX];
      properties[ShapePropertyName.originalHeight] =
        maxY(
          properties[ShapePropertyName.points],
          properties[ShapePropertyName.style][StyleName.LineWidth]
        ) - properties[ShapePropertyName.originY];
      properties[ShapePropertyName.points] = properties[
        ShapePropertyName.points
      ].map(p => [p[0] - originX, p[1] - originY]) as LinePoints;
    }
    super(properties as Required<LineShapeProperties>, bufferCtx);

    this.chunks = getLineChunks(
      {
        rect: [0, 0, this.originalWidth, this.originalHeight],
        visible: false,
      },
      this.points,
      this.style[StyleName.LineWidth]
    );

    let segmentPoints: Point[] = [];
    let prevChunkIdx = -1;
    for (const p of this.points) {
      let chunkIdx = -1;
      for (let j = 0; j < this.chunks.length; j++) {
        if (pointInsideRect(p, this.chunks[j].rect)) {
          chunkIdx = j;
          break;
        }
      }
      if (chunkIdx == prevChunkIdx) {
        segmentPoints.push(p);
      } else {
        if (segmentPoints.length > 0) {
          this.segments.push({
            points: segmentPoints,
            chunkIndex: prevChunkIdx,
          });
        }
        segmentPoints = [p];
      }
      prevChunkIdx = chunkIdx;
    }
    this.segments.push({ points: segmentPoints, chunkIndex: prevChunkIdx });
  }

  override set properties(properties: Required<LineShapeProperties>) {
    this._properties = properties;
  }

  override get properties(): Required<LineShapeProperties> {
    return this._properties;
  }

  override get style(): LineStyle {
    return this.properties[ShapePropertyName.style];
  }

  get points() {
    return this.properties[ShapePropertyName.points];
  }

  override setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties {
    const updated = this.style.updateProperty(styleProperty);
    if (updated) {
      return {
        [ShapePropertyName.style]: {
          [styleProperty.name]: styleProperty.value,
        },
      };
    }
    return {};
  }

  override renderShape(canvasRect: Rect, ctx: CanvasRenderingContext2D): void {
    const xMin = (canvasRect[0] - this.originX) / this.scaleX;
    const yMin = (canvasRect[1] - this.originY) / this.scaleY;
    const xMax = (canvasRect[2] - this.originX) / this.scaleX;
    const yMax = (canvasRect[3] - this.originY) / this.scaleY;
    const localCanvasRect: Rect = [
      Math.min(xMin, xMax),
      Math.min(yMin, yMax),
      Math.max(xMin, xMax),
      Math.max(yMin, yMax),
    ];

    this.bufferCtx.translate(this.originX, this.originY);
    this.bufferCtx.scale(this.scaleX, this.scaleY);

    this.bufferCtx.lineWidth = this.style[StyleName.LineWidth];
    this.bufferCtx.lineCap = this.style[StyleName.LineCap];
    this.bufferCtx.strokeStyle = this.style[StyleName.Color];
    this.bufferCtx.lineJoin = 'round';

    for (const chunk of this.chunks) {
      if (rectsOverlap(chunk.rect, localCanvasRect)) {
        chunk.visible = true;
      } else {
        chunk.visible = false;
      }
    }

    this.bufferCtx.stroke(this.path());
    this.bufferCtx.restore();

    ctx.save();
    ctx.globalAlpha = this.style[StyleName.Opacity];
    ctx.drawImage(this.bufferCtx.canvas, 0, 0);
    ctx.restore();

    this.bufferCtx.save();
    this.bufferCtx.clearRect(
      canvasRect[0],
      canvasRect[1],
      canvasRect[2] - canvasRect[0],
      canvasRect[3] - canvasRect[1]
    );
  }

  override path(): Path2D {
    const path = new Path2D();

    let prevDrawn = false;
    let prevPoint: Point | null = null;
    for (const segment of this.segments) {
      const draw =
        this.chunks[segment.chunkIndex] &&
        this.chunks[segment.chunkIndex].visible;
      if (draw) {
        let startIdx = 0;
        if (!prevDrawn) {
          if (prevPoint) {
            path.moveTo(prevPoint[0], prevPoint[1]);
          } else {
            path.moveTo(segment.points[0][0], segment.points[0][1]);
            startIdx = 1;
          }
        }
        for (let j = startIdx; j < segment.points.length; j++) {
          path.lineTo(segment.points[j][0], segment.points[j][1]);
        }
      } else {
        if (prevDrawn) {
          path.lineTo(segment.points[0][0], segment.points[0][1]);
        }
        prevPoint = segment.points[segment.points.length - 1];
      }
      prevDrawn = draw;
    }
    return path;
  }

  override pointInside(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): boolean {
    ctx.save();
    ctx.translate(this.originX, this.originY);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.lineWidth = this.style[StyleName.LineWidth];
    ctx.lineCap = this.style[StyleName.LineCap];
    const inside = ctx.isPointInStroke(this.path(), x, y);
    ctx.restore();
    return inside;
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    return {};
  }
}

function getLineChunks(
  chunk: Chunk,
  points: Point[],
  lineWidth: number,
  maxPoints = 100
): Chunk[] {
  if (points.length <= maxPoints) {
    return [chunk];
  }
  const horizontal =
    chunk.rect[2] - chunk.rect[0] < chunk.rect[3] - chunk.rect[1];
  if (horizontal) {
    const midY = (chunk.rect[1] + chunk.rect[3]) / 2;
    const topPoints: Point[] = [];
    const bottomPoints: Point[] = [];
    for (const p of points) {
      if (p[1] < midY) {
        topPoints.push(p);
      } else {
        bottomPoints.push(p);
      }
    }

    let topChunks: Chunk[] = [];
    if (topPoints.length > 0) {
      topChunks = getLineChunks(
        { rect: calcRect(topPoints, lineWidth), visible: false },
        topPoints,
        lineWidth
      );
    }
    let bottomChunks: Chunk[] = [];
    if (bottomPoints.length > 0) {
      bottomChunks = getLineChunks(
        { rect: calcRect(bottomPoints, lineWidth), visible: false },
        bottomPoints,
        lineWidth
      );
    }
    return [...topChunks, ...bottomChunks];
  } else {
    const midX = (chunk.rect[0] + chunk.rect[2]) / 2;
    const leftPoints: Point[] = [];
    const rightPoints: Point[] = [];
    for (const p of points) {
      if (p[0] < midX) {
        leftPoints.push(p);
      } else {
        rightPoints.push(p);
      }
    }

    let leftChunks: Chunk[] = [];
    if (leftPoints.length > 0) {
      leftChunks = getLineChunks(
        { rect: calcRect(leftPoints, lineWidth), visible: false },
        leftPoints,
        lineWidth
      );
    }
    let rightChunks: Chunk[] = [];
    if (rightPoints.length > 0) {
      rightChunks = getLineChunks(
        { rect: calcRect(rightPoints, lineWidth), visible: false },
        rightPoints,
        lineWidth
      );
    }
    return [...leftChunks, ...rightChunks];
  }
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  if (a[2] < b[0] || b[2] < a[0]) return false;
  if (a[3] < b[1] || b[3] < a[1]) return false;
  return true;
}

function pointInsideRect(p: Point, r: Rect) {
  return p[0] >= r[0] && p[0] <= r[2] && p[1] >= r[1] && p[1] <= r[3];
}

function calcRect(points: Point[], lineWidth: number): Rect {
  return [
    minX(points, lineWidth),
    minY(points, lineWidth),
    maxX(points, lineWidth),
    maxY(points, lineWidth),
  ];
}

function minX(points: Point[], lineWidth: number) {
  return Math.min(...points.map(p => p[0])) - lineWidth / 2;
}

function minY(points: Point[], lineWidth: number) {
  return Math.min(...points.map(p => p[1])) - lineWidth / 2;
}

function maxX(points: Point[], lineWidth: number) {
  return Math.max(...points.map(p => p[0])) + lineWidth / 2;
}

function maxY(points: Point[], lineWidth: number) {
  return Math.max(...points.map(p => p[1])) + lineWidth / 2;
}
