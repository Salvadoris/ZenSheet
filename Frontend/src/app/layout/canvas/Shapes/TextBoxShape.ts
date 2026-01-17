import { Point, Rect } from '../Geometry';
import {
  ChangableSerializedShapeProperties,
  ChangableShapeProperties,
} from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import {
  tabSize,
  TextBoxShapeProperties,
  TextIndex,
  TextLine,
} from '../ShapeProperties/TextBoxShapeProperties';
import { LineAlignment } from '../ShapeStyles/LineAlignment';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';
import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import { Shape } from './Shape';

interface EditProperties {
  selectedStart: number;
  properties: ChangableSerializedShapeProperties;
}

export class TextBoxShape extends Shape {
  declare protected _properties: Required<TextBoxShapeProperties>;
  #lines!: TextLine[];
  #lineSpace: number;
  #lineHeight: number;
  #padding = 10;

  constructor(
    properties: TextBoxShapeProperties,
    ctx: CanvasRenderingContext2D
  ) {
    if (
      properties[ShapePropertyName.wrap] &&
      properties[ShapePropertyName.originalWidth] === undefined
    ) {
      throw new Error('Text cannot be wrapped inside TextBox without width');
    }
    if (properties[ShapePropertyName.originalWidth] === undefined) {
      properties[ShapePropertyName.originalWidth] = 1;
    }
    if (properties[ShapePropertyName.originalHeight] === undefined) {
      properties[ShapePropertyName.originalHeight] = 1;
    }
    super(properties as Required<TextBoxShapeProperties>, ctx);
    this.#lineSpace = calcLineSpace(this.style);
    this.#lineHeight = calcLineHeight(this.style, this.#lineSpace);
    this.resizeContent();
  }

  override set properties(properties: Required<TextBoxShapeProperties>) {
    this._properties = properties;
    this.resizeContent();
  }

  override get properties(): Required<TextBoxShapeProperties> {
    return this._properties;
  }

  get text() {
    return this.properties[ShapePropertyName.text];
  }

  get wrap() {
    return this.properties[ShapePropertyName.wrap];
  }

  set wrap(wrap: boolean) {
    this.properties[ShapePropertyName.wrap] = wrap;
  }

  override get style(): TextBoxStyle {
    return this.properties[ShapePropertyName.style];
  }

  override renderShape(_canvasRect: Rect): void {
    this.renderEditedShape();
  }

  override path(): Path2D {
    const path = new Path2D();
    path.rect(this.originX, this.originY, this.width, this.height);
    return path;
  }

  override setStyleProperty(
    styleProperty: ShapeStyleProperty
  ): ChangableSerializedShapeProperties {
    const updated = this.style.updateProperty(styleProperty);
    if (updated) {
      if (
        styleProperty.name == StyleName.FontSize ||
        styleProperty.name == StyleName.FontLineSpace
      ) {
        this.#lineSpace = calcLineSpace(this.style);
        this.#lineHeight = calcLineHeight(this.style, this.#lineSpace);
      }
      return {
        ...this.resizeContent(),
        [ShapePropertyName.style]: {
          [styleProperty.name]: styleProperty.value,
        },
      };
    }
    return {};
  }

  override updateProperties(properties: ChangableShapeProperties) {
    super.updateProperties(properties);
    if (
      (properties[ShapePropertyName.width] !== undefined && this.wrap) ||
      properties[ShapePropertyName.text] !== undefined ||
      properties[ShapePropertyName.wrap] !== undefined
    ) {
      this.resizeContent();
    }
  }

  private applyFontStyle() {
    let font = '';
    if (this.style[StyleName.FontBold]) {
      font += ' bold';
    }
    if (this.style[StyleName.FontItalic]) {
      font += ' italic';
    }
    font += ` ${this.style[StyleName.FontSize]}px ${this.style[StyleName.FontName]}`;
    this.ctx.font = font;
  }

  override pointInside(x: number, y: number): boolean {
    return this.ctx.isPointInPath(this.path(), x, y);
  }

  override resizeTop(_y: number): ChangableSerializedShapeProperties {
    return {};
  }

  override resizeBottom(_y: number): ChangableSerializedShapeProperties {
    return {};
  }

  override resizeLeft(x: number): ChangableSerializedShapeProperties {
    if (!this.wrap) {
      this.wrap = true;
      return {
        ...super.resizeLeft(x),
        [ShapePropertyName.wrap]: true,
      };
    } else {
      return super.resizeLeft(x);
    }
  }

  override resizeRight(x: number): ChangableSerializedShapeProperties {
    if (!this.wrap) {
      this.wrap = true;
      return {
        ...super.resizeRight(x),
        [ShapePropertyName.wrap]: true,
      };
    } else {
      return super.resizeRight(x);
    }
  }

  private changeText(
    startIndex: number,
    endIndex: number,
    text: string
  ): ChangableSerializedShapeProperties {
    this.applyFontStyle();

    const firstIndex = Math.min(startIndex, endIndex);
    const lastIndex = Math.max(startIndex, endIndex);

    const removedLinesCount =
      this.text.slice(firstIndex, lastIndex).split('\n').length - 1;
    const addedLinesCount = text.split('\n').length - 1;
    const changedLinesCount = addedLinesCount - removedLinesCount;

    const firstOriginalLineIndex =
      this.text.slice(0, firstIndex).split('\n').length - 1;
    const oldLastOriginalLineIndex =
      this.text.slice(0, lastIndex).split('\n').length - 1;
    const lastOriginalLineIndex = oldLastOriginalLineIndex + changedLinesCount;

    let properties: ChangableSerializedShapeProperties = {};
    this.properties[ShapePropertyName.text] =
      this.text.slice(0, firstIndex) + text + this.text.slice(lastIndex);
    properties[ShapePropertyName.text] = {
      startIndex: startIndex,
      endIndex: endIndex,
      text: text,
    };
    const lines = this.text.split('\n');

    let newLines: TextLine[] = [];
    if (this.wrap) {
      for (let i = firstOriginalLineIndex; i <= lastOriginalLineIndex; i++) {
        newLines = newLines.concat(this.wrappedTextLines(lines[i], i));
      }
    } else {
      for (let i = firstOriginalLineIndex; i <= lastOriginalLineIndex; i++) {
        const line = this.textLine(lines[i], i);
        newLines.push(line);
        const newWidth = Math.max(
          this.width,
          this.lineWidth(line) + this.#padding * 2
        );
        if (newWidth !== this.width) {
          this.width = newWidth;
          this.scaleX = this.width / this.originalWidth;
          properties[ShapePropertyName.width] = newWidth;
        }
      }
    }

    let firstLineIndex = 0;
    for (let i = 0; i < this.#lines.length; i++) {
      if (this.#lines[i].originalLineIndex == firstOriginalLineIndex) {
        firstLineIndex = i;
        break;
      }
    }
    let lastLineIndex = this.#lines.length;
    for (let i = 0; i < this.#lines.length; i++) {
      if (this.#lines[i].originalLineIndex == oldLastOriginalLineIndex + 1) {
        lastLineIndex = i;
        break;
      }
    }

    const later = this.#lines.slice(lastLineIndex);
    this.#lines = [
      ...this.#lines.slice(0, firstLineIndex),
      ...newLines,
      ...later,
    ];

    for (const line of this.#lines) {
      if (line.originalLineIndex > lastOriginalLineIndex) {
        line.originalLineIndex += changedLinesCount;
      }
    }

    const minWidth = this.minWidth;
    this.properties[ShapePropertyName.minWidth] =
      Math.max(...this.#lines.map(l => l.maxChunkWidth)) + this.#padding * 2;
    this.width = Math.max(this.width, this.minWidth);
    if (minWidth !== this.minWidth) {
      properties[ShapePropertyName.minWidth] = this.minWidth;
    }

    const newHeight = this.#lineHeight * this.#lines.length + this.#padding * 2;
    if (newHeight != this.height) {
      properties = {
        ...properties,
        ...super.resizeBottom(this.originY + newHeight, false),
      };
    }
    return properties;
  }

  override resizeContent(): ChangableSerializedShapeProperties {
    this.applyFontStyle();
    this.#lines = [];
    const lines = this.text.split('\n');
    const properties: ChangableSerializedShapeProperties = {};
    if (this.wrap) {
      lines.forEach((line, index) => {
        this.#lines = this.#lines.concat(this.wrappedTextLines(line, index));
      });
    } else {
      this.#lines = lines.map((line, index) => this.textLine(line, index));

      this.width = Math.max(
        this.width,
        Math.max(...this.#lines.map(line => this.lineWidth(line))) +
          this.#padding * 2
      );
      properties[ShapePropertyName.width] = this.width;
      this.scaleX = this.width / this.originalWidth;
    }

    const newHeight = this.#lineHeight * this.#lines.length + this.#padding * 2;
    if (newHeight != this.height) {
      return {
        ...properties,
        ...super.resizeBottom(this.originY + newHeight, false),
      };
    }
    return properties;
  }

  renderEditedShape(
    selectedStart: number | null = null,
    selectedEnd: number | null = null
  ) {
    this.ctx.save();
    const defaultColor =
      this.style[StyleName.Color] +
      this.style[StyleName.Opacity].toString(16).padStart(2, '0');
    this.applyFontStyle();
    this.ctx.textBaseline = 'top';

    if (selectedStart !== null && selectedEnd !== null) {
      const firstIndex = Math.max(Math.min(selectedStart, selectedEnd), 0);
      const lastIndex = Math.min(
        Math.max(selectedStart, selectedEnd),
        this.text.length
      );
      const firstTextIndex = this.globalIndexToTextIndex(firstIndex);
      const lastTextIndex = this.globalIndexToTextIndex(lastIndex);

      for (let i = 0; i < firstTextIndex.line; i++) {
        this.drawLine(i, defaultColor);
      }
      for (let i = lastTextIndex.line; i < this.#lines.length; i++) {
        this.drawLine(i, defaultColor);
      }

      if (firstTextIndex.line == lastTextIndex.line) {
        this.drawLine(firstTextIndex.line, defaultColor, [
          firstTextIndex.char,
          lastTextIndex.char,
        ]);
      } else {
        for (let i = firstTextIndex.line + 1; i < lastTextIndex.line; i++) {
          this.drawLine(i, defaultColor, [0, this.#lines[i].text.length]);
        }
        this.drawLine(firstTextIndex.line, defaultColor, [
          firstTextIndex.char,
          this.#lines[firstTextIndex.line].text.length,
        ]);
        this.drawLine(lastTextIndex.line, defaultColor, [
          0,
          lastTextIndex.char,
        ]);
      }
    } else {
      this.#lines.forEach((_line, index) => {
        this.drawLine(index, defaultColor);
      });
      if (selectedStart !== null) {
        const textIndex = this.globalIndexToTextIndex(
          Math.min(Math.max(selectedStart, 0), this.text.length)
        );
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
          this.xPositonInLine(textIndex),
          this.originY +
            this.#padding +
            this.#lineHeight * textIndex.line +
            this.#lineSpace / 2,
          2,
          this.style[StyleName.FontSize]
        );
      }
    }
    this.ctx.restore();
  }

  insertText(text: string, index: number): EditProperties {
    return {
      selectedStart: index + text.length,
      properties: this.changeText(index, index, text),
    };
  }

  deleteChar(index: number): EditProperties {
    if (index > this.text.length) {
      return { selectedStart: this.text.length, properties: {} };
    }
    if (index < 0) {
      index = 0;
    }
    return {
      selectedStart: index - 1,
      properties: this.changeText(index - 1, index, ''),
    };
  }

  deleteRange(start: number, end: number): EditProperties {
    return {
      selectedStart: Math.min(start, end),
      properties: this.changeText(start, end, ''),
    };
  }

  lineChunkRangeAtIndex(index: number): [number, number] {
    const textIndex = this.globalIndexToTextIndex(index);
    const lineChunks =
      this.#lines[textIndex.line].text.matchAll(/\w+|[^\w\s]+/dg);
    for (const chunk of lineChunks) {
      if (chunk.indices) {
        if (
          textIndex.char <= chunk.indices[0][1] &&
          textIndex.char >= chunk.indices[0][0]
        ) {
          return [
            this.textIndexToGlobalIndex({
              line: textIndex.line,
              char: chunk.indices[0][0],
            }),
            this.textIndexToGlobalIndex({
              line: textIndex.line,
              char: chunk.indices[0][1],
            }),
          ];
        }
      }
    }
    return [index, index];
  }

  previousWordStartIndex(index: number): number {
    if (index <= 0) {
      return 0;
    }
    const textIndex = this.globalIndexToTextIndex(index);
    if (textIndex.char === 0) {
      return index - 1;
    }

    const lineChunks =
      this.#lines[textIndex.line].text.match(/\w+ *|\t *|[^\t\w ]+ */g) ?? [];
    let currentLength = 0;
    for (const chunk of lineChunks) {
      if (textIndex.char <= currentLength + chunk.length) {
        return this.textIndexToGlobalIndex({
          line: textIndex.line,
          char: currentLength,
        });
      }
      currentLength += chunk.length;
    }
    return this.textIndexToGlobalIndex({
      line: textIndex.line,
      char: currentLength,
    });
  }

  nextWordEndIndex(index: number): number {
    if (index >= this.text.length) {
      return this.text.length;
    }

    const textIndex = this.globalIndexToTextIndex(index);
    if (textIndex.char === this.#lines[textIndex.line].text.length) {
      return index + 1;
    }

    const lineChunks =
      this.#lines[textIndex.line].text.match(/ *\w+| *\t| *[^\t\w ]+/g) ?? [];
    let currentLength = 0;
    for (const chunk of lineChunks) {
      currentLength += chunk.length;
      if (textIndex.char < currentLength) {
        return this.textIndexToGlobalIndex({
          line: textIndex.line,
          char: currentLength,
        });
      }
    }

    return this.textIndexToGlobalIndex({
      line: textIndex.line,
      char: currentLength,
    });
  }

  lineStart(index: number) {
    return this.textIndexToGlobalIndex({
      line: this.globalIndexToTextIndex(index).line,
      char: 0,
    });
  }

  lineEnd(index: number) {
    const textIndex = this.globalIndexToTextIndex(index);
    if (
      textIndex.line != this.#lines.length - 1 &&
      this.#lines[textIndex.line].originalLineIndex ===
        this.#lines[textIndex.line + 1].originalLineIndex
    ) {
      return this.textIndexToGlobalIndex({
        line: textIndex.line,
        char: this.#lines[textIndex.line].text.length - 1,
      });
    }
    return this.textIndexToGlobalIndex({
      line: textIndex.line,
      char: this.#lines[textIndex.line].text.length,
    });
  }

  getAboveIndex(index: number): number {
    this.applyFontStyle();
    const pos = this.positionFromIndex(index);
    const currentLineIndex = Math.floor(
      (pos[1] - this.originY - this.#padding) / this.#lineHeight
    );
    if (currentLineIndex <= 0) {
      return 0;
    }
    const newLineIndex = currentLineIndex - 1;
    const charIndex = this.charIndexInLine(newLineIndex, pos[0]);
    if (
      this.#lines[currentLineIndex].originalLineIndex ===
        this.#lines[newLineIndex].originalLineIndex &&
      charIndex == this.#lines[newLineIndex].text.length
    ) {
      return this.textIndexToGlobalIndex({
        line: newLineIndex,
        char: this.#lines[newLineIndex].text.length - 1,
      });
    }
    return this.textIndexToGlobalIndex({
      line: newLineIndex,
      char: charIndex,
    });
  }

  getBelowIndex(index: number): number {
    this.applyFontStyle();
    const pos = this.positionFromIndex(index);
    const currentLineIndex = Math.floor(
      (pos[1] - this.originY - this.#padding) / this.#lineHeight
    );
    if (currentLineIndex >= this.#lines.length - 1) {
      return this.text.length;
    }

    const newLineIndex = currentLineIndex + 1;
    const charIndex = this.charIndexInLine(newLineIndex, pos[0]);
    if (
      newLineIndex != this.#lines.length - 1 &&
      charIndex == this.#lines[newLineIndex].text.length &&
      this.#lines[newLineIndex].originalLineIndex ===
        this.#lines[newLineIndex + 1].originalLineIndex
    ) {
      return this.textIndexToGlobalIndex({
        line: newLineIndex,
        char: this.#lines[newLineIndex].text.length - 1,
      });
    }
    return this.textIndexToGlobalIndex({
      line: newLineIndex,
      char: charIndex,
    });
  }

  indexFromPosition(x: number, y: number): number {
    this.applyFontStyle();
    const lineIndex = Math.floor(
      (y - this.originY - this.#padding) / this.#lineHeight
    );
    if (lineIndex < 0) {
      return 0;
    }
    if (lineIndex > this.#lines.length - 1) {
      return this.text.length;
    }
    return this.textIndexToGlobalIndex({
      line: lineIndex,
      char: this.charIndexInLine(lineIndex, x),
    });
  }

  private positionFromIndex(index: number): Point {
    if (index <= 0) {
      return [this.lineStartX(0), this.originY + this.#padding];
    }
    if (index >= this.text.length) {
      return [
        this.xPositonInLine({
          line: this.#lines.length - 1,
          char: this.#lines[this.#lines.length - 1].text.length,
        }),
        this.originY +
          this.#padding +
          this.#lineHeight * this.#lines.length -
          1,
      ];
    }

    const textIndex = this.globalIndexToTextIndex(index);
    return [
      this.xPositonInLine(textIndex),
      this.originY + this.#padding + this.#lineHeight * textIndex.line,
    ];
  }

  private lineStartX(lineIndex: number) {
    if (this.style[StyleName.FontAlignment] == LineAlignment.Right) {
      return (
        this.originX -
        this.#padding +
        this.width -
        this.lineWidth(this.#lines[lineIndex])
      );
    } else if (this.style[StyleName.FontAlignment] == LineAlignment.Center) {
      return (
        this.originX +
        this.width / 2 -
        this.lineWidth(this.#lines[lineIndex]) / 2
      );
    }
    return this.originX + this.#padding;
  }

  private lineChunks(line: string): string[] {
    return line.match(/\t *|[^ \t]+ */g) ?? [];
  }

  private globalIndexToTextIndex(index: number): TextIndex {
    let currentLength = 0;
    for (let i = 0; i < this.#lines.length; i++) {
      let currentLineLength = this.#lines[i].text.length;
      if (i < this.#lines.length - 1) {
        if (
          this.#lines[i].originalLineIndex !==
          this.#lines[i + 1].originalLineIndex
        ) {
          currentLineLength += 1;
        }
      }
      if (index < currentLength + currentLineLength) {
        return { line: i, char: index - currentLength };
      }
      currentLength += currentLineLength;
    }
    return {
      line: this.#lines.length - 1,
      char: this.#lines[this.#lines.length - 1].text.length,
    };
  }

  private textIndexToGlobalIndex(textIndex: TextIndex): number {
    let previousOriginalLineIndex = 0;
    let currentLength = 0;
    for (const line of this.#lines.slice(0, textIndex.line)) {
      let currentLineLength = line.text.length;
      if (line.originalLineIndex !== previousOriginalLineIndex) {
        currentLineLength += 1;
      }
      currentLength += currentLineLength;
      previousOriginalLineIndex = line.originalLineIndex;
    }
    if (
      this.#lines[textIndex.line].originalLineIndex !==
      previousOriginalLineIndex
    ) {
      return currentLength + 1 + textIndex.char;
    } else {
      return currentLength + textIndex.char;
    }
  }

  private lineWidth(line: TextLine): number {
    return (
      this.ctx.measureText(line.text.replace('\t', '')).width +
      line.tabWidths.reduce((sum, width) => sum + width, 0)
    );
  }

  private xPositonInLine(textIndex: TextIndex): number {
    const lineStartX = this.lineStartX(textIndex.line);
    const line = this.#lines[textIndex.line].text.slice(0, textIndex.char);

    const tabCount = line.split('\t').length - 1;
    const tabWidths = this.#lines[textIndex.line].tabWidths
      .slice(0, tabCount)
      .reduce((sum, width) => sum + width, 0);
    return (
      lineStartX +
      this.ctx.measureText(line.replaceAll('\t', '')).width +
      tabWidths
    );
  }

  private charIndexInLine(lineIndex: number, x: number): number {
    const line = this.#lines[lineIndex];
    const lineStart = this.lineStartX(lineIndex);
    let tabIndex = 0;
    let currentAccumulatedTabWidth = 0;
    let tablessLine = '';
    for (let i = 0; i < line.text.length; i++) {
      if (line.text[i] === '\t') {
        const width = line.tabWidths[tabIndex];
        tabIndex++;

        if (
          x <
          lineStart +
            this.ctx.measureText(tablessLine).width +
            currentAccumulatedTabWidth +
            width / 2
        ) {
          return i;
        }

        currentAccumulatedTabWidth += width;
      } else {
        tablessLine += line.text[i];
        const width = this.ctx.measureText(line.text[i]).width;
        if (
          x <
          lineStart +
            this.ctx.measureText(tablessLine).width -
            width +
            currentAccumulatedTabWidth +
            width / 2
        ) {
          return i;
        }
      }
    }

    if (
      lineIndex < this.#lines.length - 1 &&
      this.#lines[lineIndex].originalLineIndex ===
        this.#lines[lineIndex + 1].originalLineIndex
    ) {
      return line.text.length - 1;
    }

    return line.text.length;
  }

  private wrappedTextLines(
    line: string,
    originalLineIndex: number
  ): TextLine[] {
    let currentLineWidth = 0;
    let maxChunkWidth = 0;
    let currentLine: TextLine = {
      text: '',
      tabWidths: [],
      originalLineIndex: originalLineIndex,
      maxChunkWidth: 0,
    };
    const lines: TextLine[] = [];
    for (const chunk of this.lineChunks(line)) {
      let chunkWidth = 0;
      if (chunk[0] === '\t') {
        chunkWidth =
          this.tabWidth(currentLineWidth) +
          this.ctx.measureText(chunk.slice(1)).width;
      } else {
        chunkWidth = this.ctx.measureText(chunk).width;
      }
      if (chunkWidth > maxChunkWidth) {
        maxChunkWidth = chunkWidth;
      }

      if (currentLineWidth + chunkWidth > this.width) {
        currentLine.maxChunkWidth = maxChunkWidth;
        maxChunkWidth = 0;
        lines.push(currentLine);

        currentLine = {
          text: chunk,
          tabWidths: [],
          originalLineIndex: originalLineIndex,
          maxChunkWidth: 0,
        };
        if (chunk[0] === '\t') {
          currentLine.tabWidths.push(this.tabWidth(0));
        }
        currentLineWidth = chunkWidth;
      } else {
        currentLine.text += chunk;
        if (chunk[0] === '\t') {
          currentLine.tabWidths.push(this.tabWidth(currentLineWidth));
        }
        currentLineWidth += chunkWidth;
      }
    }

    currentLine.maxChunkWidth = maxChunkWidth;
    lines.push(currentLine);
    return lines;
  }

  private textLine(line: string, originalLineIndex: number): TextLine {
    const lineChunks = this.lineChunks(line);
    let currentWidth = 0;
    let maxChunkWidth = 0;
    const tabWidths: number[] = [];
    for (const chunk of lineChunks) {
      let chunkWidth = 0;
      if (chunk[0] === '\t') {
        const tabWidth = this.tabWidth(currentWidth);
        chunkWidth = tabWidth + this.ctx.measureText(chunk.slice(1)).width;
        tabWidths.push(tabWidth);
      } else {
        chunkWidth = this.ctx.measureText(chunk).width;
      }
      if (chunkWidth > maxChunkWidth) {
        maxChunkWidth = chunkWidth;
      }
      currentWidth += chunkWidth;
    }
    return {
      text: line,
      tabWidths: tabWidths,
      originalLineIndex: originalLineIndex,
      maxChunkWidth: maxChunkWidth,
    };
  }

  private drawLine(
    lineIndex: number,
    defaultColor: string,
    selectedRange: [number, number] | null = null
  ) {
    this.ctx.textAlign = 'left';
    const y =
      this.originY +
      this.#padding +
      lineIndex * this.#lineHeight +
      this.#lineSpace / 2;
    if (selectedRange) {
      const textColor = 'white';
      const markColor = '#3399FF';
      let x1 = 0;
      if (
        selectedRange[0] < this.#lines[lineIndex].text.length &&
        this.#lines[lineIndex].text[selectedRange[0]] != '\t'
      ) {
        x1 =
          this.xPositonInLine({ line: lineIndex, char: selectedRange[0] + 1 }) -
          this.ctx.measureText(this.#lines[lineIndex].text[selectedRange[0]])
            .width;
      } else {
        x1 = this.xPositonInLine({ line: lineIndex, char: selectedRange[0] });
      }
      let x2 = 0;
      if (
        selectedRange[0] < this.#lines[lineIndex].text.length &&
        this.#lines[lineIndex].text[selectedRange[1]] != '\t'
      ) {
        x2 =
          this.xPositonInLine({ line: lineIndex, char: selectedRange[1] + 1 }) -
          this.ctx.measureText(this.#lines[lineIndex].text[selectedRange[1]])
            .width;
      } else {
        x2 = this.xPositonInLine({ line: lineIndex, char: selectedRange[1] });
      }

      this.ctx.fillStyle = markColor;
      this.ctx.fillRect(
        x1,
        this.originY + this.#padding + this.#lineHeight * lineIndex,
        this.xPositonInLine({ line: lineIndex, char: selectedRange[1] }) - x1,
        this.#lineHeight
      );

      this.drawText(lineIndex, 0, selectedRange[0], defaultColor, [
        this.lineStartX(lineIndex),
        y,
      ]);
      this.drawText(lineIndex, selectedRange[0], selectedRange[1], textColor, [
        x1,
        y,
      ]);
      this.drawText(
        lineIndex,
        selectedRange[1],
        this.#lines[lineIndex].text.length,
        defaultColor,
        [x2, y]
      );
    } else {
      this.drawText(
        lineIndex,
        0,
        this.#lines[lineIndex].text.length,
        defaultColor,
        [this.lineStartX(lineIndex), y]
      );
    }
  }

  private drawText(
    lineIndex: number,
    start: number,
    end: number,
    color: string,
    position: Point
  ) {
    const tabIndex =
      this.#lines[lineIndex].text.slice(0, start).split('\t').length - 1;
    const lineParts = this.#lines[lineIndex].text.slice(start, end).split('\t');
    this.ctx.fillStyle = color;
    let currentWidth = position[0];
    for (let i = 0; i < lineParts.length; i++) {
      if (i != 0) {
        currentWidth += this.#lines[lineIndex].tabWidths[tabIndex + i - 1];
      }
      this.ctx.fillText(lineParts[i], currentWidth, position[1]);
      currentWidth += this.ctx.measureText(lineParts[i]).width;
    }
  }

  private tabWidth(precedingWidth: number) {
    const maxTabWidth = tabSize * this.style[StyleName.FontSize];
    const overloadWidth = precedingWidth + maxTabWidth;
    return overloadWidth - (overloadWidth % maxTabWidth) - precedingWidth;
  }
}

export function calcLineSpace(style: TextBoxStyle) {
  return (style[StyleName.FontLineSpace] - 1) * style[StyleName.FontSize];
}

function calcLineHeight(style: TextBoxStyle, lineSpace: number) {
  return style[StyleName.FontSize] + lineSpace;
}
