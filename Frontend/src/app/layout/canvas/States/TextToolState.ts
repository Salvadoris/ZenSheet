import { CanvasComponent } from '../canvas.component';
import { ChangableSerializedShapeProperties } from '../ShapeProperties/ShapeProperties';
import { ShapePropertyName } from '../ShapeProperties/ShapePropertyName';
import { calcLineSpace, TextBoxShape } from '../Shapes/TextBoxShape';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';
import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import { CanvasToolState } from './CanvasToolState';

export class TextToolState extends CanvasToolState {
  #currentTextBox: TextBoxShape | null = null;
  #hoveredTextBox: TextBoxShape | null = null;
  #selectedStart: number | null = null;
  #selectedEnd: number | null = null;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.changeStyle(new TextBoxStyle(this.canvas.style));
    if (this.canvas.selectFrameCtx) {
      this.canvas.changeCursor('text');
    }
  }

  get currentTextBox() {
    return this.#currentTextBox;
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.canvas.style.updateProperty(styleProperty);
    if (this.#currentTextBox) {
      const properties = this.#currentTextBox.setStyleProperty(styleProperty);
      this.canvas.changeShapesProperties([
        {
          id: this.#currentTextBox.properties[ShapePropertyName.id],
          properties: properties,
        },
      ]);
      this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  private setSelectedEnd(index: number) {
    if (this.#selectedStart !== null) {
      if (index != this.#selectedStart) {
        this.#selectedEnd = index;
        return;
      }
    }
    this.#selectedEnd = null;
  }

  override remove(): void {
    this.releaseCurrentTextBox();
    this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
  }

  private releaseCurrentTextBox() {
    if (this.#currentTextBox) {
      if (this.#currentTextBox.text.length == 0) {
        this.canvas.removeShapes([
          this.#currentTextBox.properties[ShapePropertyName.id],
        ]);
      } else {
        this.#currentTextBox.properties[ShapePropertyName.edited] = false;
        this.canvas.changeShapesProperties([
          {
            id: this.#currentTextBox.properties[ShapePropertyName.id],
            properties: { [ShapePropertyName.edited]: false },
          },
        ]);
      }
      this.#currentTextBox = null;
      this.#selectedStart = null;
      this.#selectedEnd = null;
    }
  }

  renderTextBoxRect(): void {
    if (this.#currentTextBox) {
      this.#currentTextBox.renderEditedShape(
        this.canvas.trueRect,
        this.canvas.shapeCtx,
        this.#selectedStart,
        this.#selectedEnd
      );
      this.drawTextBoxRect(this.#currentTextBox);
    }
    if (this.#hoveredTextBox && this.#hoveredTextBox !== this.#currentTextBox) {
      this.drawTextBoxRect(this.#hoveredTextBox);
    }
  }

  private drawTextBoxRect(textBox: TextBoxShape) {
    this.canvas.selectFrameCtx.strokeStyle = 'grey';
    this.canvas.selectFrameCtx.lineWidth = 4 / this.canvas.scale;
    this.canvas.selectFrameCtx.strokeRect(
      textBox.originX - this.canvas.selectFrameCtx.lineWidth / 2,
      textBox.originY - this.canvas.selectFrameCtx.lineWidth / 2,
      textBox.width + this.canvas.selectFrameCtx.lineWidth,
      textBox.height + this.canvas.selectFrameCtx.lineWidth
    );
  }

  private findTextBoxOnCursor() {
    let textBox: TextBoxShape | null = null;
    if (
      this.#currentTextBox &&
      this.#currentTextBox.pointInside(
        this.canvas.shapeCtx,
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      )
    ) {
      textBox = this.#currentTextBox;
    } else {
      for (const shape of this.canvas.shapes) {
        if (
          shape instanceof TextBoxShape &&
          shape.pointInside(
            this.canvas.shapeCtx,
            this.canvas.cursor[0],
            this.canvas.cursor[1]
          )
        ) {
          textBox = shape;
          break;
        }
      }
    }
    return textBox;
  }

  private createTextBox() {
    this.releaseCurrentTextBox();
    const style = new TextBoxStyle(this.canvas.style);
    const lineSpace = calcLineSpace(style);
    this.#currentTextBox = new TextBoxShape(
      {
        [ShapePropertyName.id]: crypto.randomUUID(),
        [ShapePropertyName.text]: '',
        [ShapePropertyName.style]: new TextBoxStyle(this.canvas.style),
        [ShapePropertyName.wrap]: false,
        [ShapePropertyName.originX]: this.canvas.cursor[0],
        [ShapePropertyName.originY]:
          this.canvas.cursor[1] - (style[StyleName.FontSize] / 2 - lineSpace),
        [ShapePropertyName.edited]: true,
        [ShapePropertyName.selected]: false,
        [ShapePropertyName.horizontallyInvertable]: false,
      },
      this.canvas.bufferCtx
    );
    this.canvas.addShapes([this.#currentTextBox]);
  }

  private setCurrentTextBox(textBox: TextBoxShape) {
    if (this.#currentTextBox) {
      if (
        textBox.properties[ShapePropertyName.id] ===
        this.#currentTextBox.properties[ShapePropertyName.id]
      ) {
        return;
      } else {
        this.releaseCurrentTextBox();
      }
    }
    this.#currentTextBox = textBox;
    this.#currentTextBox.properties[ShapePropertyName.edited] = true;
    this.canvas.changeShapesProperties([
      {
        id: this.#currentTextBox.properties[ShapePropertyName.id],
        properties: { [ShapePropertyName.edited]: true },
      },
    ]);
  }

  private callChangeAction(properties: ChangableSerializedShapeProperties) {
    if (this.#currentTextBox && Object.keys(properties).length !== 0) {
      this.canvas.changeShapesProperties([
        {
          id: this.#currentTextBox.properties[ShapePropertyName.id],
          properties: properties,
        },
      ]);
    }
  }

  private removeSelectedRange() {
    if (
      this.#currentTextBox &&
      this.#selectedStart !== null &&
      this.#selectedEnd !== null
    ) {
      const { selectedStart, properties } = this.#currentTextBox.deleteRange(
        this.#selectedStart,
        this.#selectedEnd
      );
      this.#selectedStart = selectedStart;
      this.callChangeAction(properties);
      this.#selectedEnd = null;
    }
  }

  override onMouseDown(event: MouseEvent): void {
    if (this.canvas.leftmouseDown) {
      const textBox = this.findTextBoxOnCursor();
      if (textBox) {
        this.setCurrentTextBox(textBox);
        this.canvas.showKeyboard();
      } else {
        this.createTextBox();
        this.canvas.showKeyboard();
      }
      if (this.#currentTextBox) {
        this.canvas.changeStyle(this.#currentTextBox.style);

        const index = this.#currentTextBox.indexFromPosition(
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        );
        if (event.shiftKey && this.#selectedStart !== null) {
          this.#selectedEnd = index;
        } else {
          this.#selectedStart = index;
          this.#selectedEnd = null;
        }
      }
    }
  }

  override onPressedMouseMove(_event: MouseEvent): void {
    if (
      this.canvas.leftmouseDown &&
      this.#currentTextBox &&
      this.#selectedStart !== null
    ) {
      this.setSelectedEnd(
        this.#currentTextBox.indexFromPosition(
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      );
      this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  override onHoveringMouseMove(_event: MouseEvent): void {
    const textBox = this.findTextBoxOnCursor();
    if (textBox) {
      this.#hoveredTextBox = textBox;
    } else {
      this.#hoveredTextBox = null;
    }
    this.canvas.renderCanvas({ shapesEdited: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onMouseUp(_event: MouseEvent): void {}

  override onKeyPress(event: KeyboardEvent): void {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      if (event.key === 'Enter') {
        this.insertText('\n');
      } else {
        this.insertText(event.key);
      }
      this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  override onKeyDown(event: KeyboardEvent): void {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      switch (event.key) {
        case 'a':
          if (event.ctrlKey) {
            event.preventDefault();
            this.selectAll();
          }
          break;
        case 'c':
          if (event.ctrlKey) {
            event.preventDefault();
            this.copySelectedRangeToClipboard();
          }
          break;
        case 'v':
          if (event.ctrlKey) {
            event.preventDefault();
            this.pasteClipboardToCurrentTextBox();
          }
          break;
        case 'Delete':
          if (this.#selectedEnd !== null) {
            this.removeSelectedRange();
          } else {
            if (event.ctrlKey) {
              const { selectedStart, properties } =
                this.#currentTextBox.deleteRange(
                  this.#selectedStart,
                  this.#currentTextBox.nextWordEndIndex(this.#selectedStart)
                );
              this.#selectedStart = selectedStart;
              this.callChangeAction(properties);
            } else {
              const { selectedStart, properties } =
                this.#currentTextBox.deleteChar(this.#selectedStart + 1);
              this.#selectedStart = selectedStart;
              this.callChangeAction(properties);
            }
          }
          break;
        case 'Backspace':
          event.preventDefault();
          if (this.#selectedEnd !== null) {
            this.removeSelectedRange();
          } else {
            if (event.ctrlKey) {
              const { selectedStart, properties } =
                this.#currentTextBox.deleteRange(
                  this.#currentTextBox.previousWordStartIndex(
                    this.#selectedStart
                  ),
                  this.#selectedStart
                );
              this.#selectedStart = selectedStart;
              this.callChangeAction(properties);
            } else {
              const { selectedStart, properties } =
                this.#currentTextBox.deleteChar(this.#selectedStart);
              this.#selectedStart = selectedStart;
              this.callChangeAction(properties);
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.moveEditUp(event);
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.moveEditDown(event);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.moveEditLeft(event);
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.moveEditRight(event);
          break;
        case 'Tab':
          event.preventDefault();
          if (this.#selectedEnd !== null) {
            this.removeSelectedRange();
          }
          this.insertText('\t');
          break;
        case 'Home':
          event.preventDefault();
          this.moveEditToLineStart();
          break;
        case 'End':
          event.preventDefault();
          this.moveEditToLineEnd();
          break;
      }
      this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  override onDoubleClick(_event: MouseEvent): void {
    if (this.#currentTextBox) {
      const index = this.#currentTextBox.indexFromPosition(
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      );
      const range = this.#currentTextBox.lineChunkRangeAtIndex(index);
      if (range[0] == range[1]) {
        this.#selectedStart = range[0];
        this.#selectedEnd = null;
      } else {
        [this.#selectedStart, this.#selectedEnd] =
          this.#currentTextBox.lineChunkRangeAtIndex(index);
      }
      this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
    }
  }

  private insertText(text: string): boolean {
    if (
      this.#currentTextBox &&
      this.#selectedStart !== null &&
      text.length > 0
    ) {
      this.removeSelectedRange();
      const { selectedStart, properties } = this.#currentTextBox.insertText(
        text,
        this.#selectedStart
      );
      this.#selectedStart = selectedStart;
      this.callChangeAction(properties);
      return true;
    }
    return false;
  }

  private copySelectedRangeToClipboard() {
    if (
      this.#currentTextBox &&
      this.#selectedStart !== null &&
      this.#selectedEnd !== null
    ) {
      const selectedText = this.#currentTextBox.text.slice(
        Math.min(this.#selectedStart, this.#selectedEnd),
        Math.max(this.#selectedStart, this.#selectedEnd)
      );
      navigator.clipboard.writeText(selectedText);
    }
  }

  private pasteClipboardToCurrentTextBox() {
    navigator.clipboard.readText().then(text => {
      const inserted = this.insertText(text);
      if (inserted) {
        this.canvas.renderCanvas({ shapesChanged: true, shapesEdited: true });
      }
    });
  }

  private moveEditUp(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      if (this.#selectedEnd && this.#selectedEnd > this.#selectedStart) {
        const tmp = this.#selectedStart;
        this.#selectedStart = this.#selectedEnd;
        this.#selectedEnd = tmp;
      }
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = this.#currentTextBox.getAboveIndex(latestIndex);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditDown(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = this.#currentTextBox.getBelowIndex(latestIndex);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditLeft(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = Math.max(latestIndex - 1, 0);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else if (event.ctrlKey) {
        this.moveEditToPreviousWordStart();
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditRight(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = Math.min(latestIndex + 1, this.#currentTextBox.text.length);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else if (event.ctrlKey) {
        this.moveEditToNextWordEnd();
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditToPreviousWordStart() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart =
        this.#currentTextBox.previousWordStartIndex(latestIndex);
    }
  }

  private moveEditToNextWordEnd() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart = this.#currentTextBox.nextWordEndIndex(latestIndex);
    }
  }

  private moveEditToLineStart() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart = this.#currentTextBox.lineStart(latestIndex);
    }
  }

  private moveEditToLineEnd() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart = this.#currentTextBox.lineEnd(latestIndex);
    }
  }

  private selectAll() {
    if (this.#currentTextBox) {
      this.#selectedStart = 0;
      this.#selectedEnd = this.#currentTextBox.text.length;
    }
  }
}
