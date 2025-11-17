import { Point } from './Point';
import { Rect } from './Rect';
import { Shape } from './Shape';

export type LinePoints =
  | [Point, Point, ...Point[]]
  | [Point, ...Point[], Point]
  | [...Point[], Point, Point];

interface Chunk {
  rect: Rect;
  visible: boolean;
}

interface Segment {
  points: Point[];
  chunkIndex: number;
}

export class LineShape extends Shape {
  public points!: Point[];
  private chunks: Chunk[] = [];
  private segments: Segment[] = [];
  constructor(
    points: LinePoints,
    public lineWidth: number,
    public cap: CanvasLineCap,
    public color: string
  ) {
    const originX = minX(points, lineWidth);
    const originY = minY(points, lineWidth);
    const width = maxX(points, lineWidth) - originX;
    const height = maxY(points, lineWidth) - originY;
    super([originX, originY], width, height);

    const pts: Point[] = points.map(p => [p[0] - originX, p[1] - originY]);
    this.points = pts;
    this.chunks = getLineChunks(
      { rect: [0, 0, width, height], visible: false },
      pts,
      lineWidth
    );

    let segmentPoints: Point[] = [];
    let prevChunkIdx = -1;
    for (const p of pts) {
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

  override render(ctx: CanvasRenderingContext2D, canvasRect: Rect): void {
    super.render(ctx, canvasRect);
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

    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.cap;
    ctx.strokeStyle = this.color;
    ctx.lineJoin = 'round';

    for (const chunk of this.chunks) {
      if (rectsOverlap(chunk.rect, localCanvasRect)) {
        chunk.visible = true;
      } else {
        chunk.visible = false;
      }
    }

    ctx.stroke(this.path());
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
            path.moveTo(
              this.calcXToVisual(prevPoint[0]),
              this.calcYToVisual(prevPoint[1])
            );
          } else {
            path.moveTo(
              this.calcXToVisual(segment.points[0][0]),
              this.calcYToVisual(segment.points[0][1])
            );
            startIdx = 1;
          }
        }
        for (let j = startIdx; j < segment.points.length; j++) {
          path.lineTo(
            this.calcXToVisual(segment.points[j][0]),
            this.calcYToVisual(segment.points[j][1])
          );
        }
      } else {
        if (prevDrawn) {
          path.lineTo(
            this.calcXToVisual(segment.points[0][0]),
            this.calcYToVisual(segment.points[0][1])
          );
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
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.cap;
    return ctx.isPointInStroke(this.path(), x, y);
  }

  private calcXToVisual(x: number) {
    return x * this.scaleX + this.originX;
  }
  private calcYToVisual(y: number) {
    return y * this.scaleY + this.originY;
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
