import { Form } from '../Chunks/Form';
import {
    ChangableDrawingProperties,
    DrawingProperties,
} from '../DrawingProperties/DrawingProperties';
import { Point } from '../Geometry';
import { Shape } from '../Shapes/Shape';

export abstract class Drawing extends Form {
  declare protected _properties: DrawingProperties;

  override get properties() {
    return this._properties;
  }

  override set properties(properties: DrawingProperties) {
    this._properties = properties;
  }

  abstract update(p: Point): ChangableDrawingProperties | null;

  abstract toShape(): Shape;
}
