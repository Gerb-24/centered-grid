import { Ray } from "@motion-canvas/2d";
import { range } from "@motion-canvas/core";
import { CenteredGrid, CenteredGridProps } from "./CenteredGrid"

export class CenteredGridWithGridlines extends CenteredGrid {
  constructor({ children, ...props }: CenteredGridProps) {
    super(props)

    const col_lines = range(props.manager.columnAmount + 1).map(col_index => new Ray({
      from: () => this.manager.getCornerPosition(col_index, 0),
      to: () => this.manager.getCornerPosition(col_index, props.manager.rowAmount),
      stroke: this.stroke(),
      lineDash: [10, 10],
      lineWidth: 2,
    }))

    const row_lines = range(props.manager.rowAmount + 1).map(row_index => new Ray({
      from: () => this.manager.getCornerPosition(0, row_index),
      to: () => this.manager.getCornerPosition(props.manager.columnAmount, row_index),
      stroke: this.stroke(),
      lineDash: [10, 10],
      lineWidth: 2,
    }))

    this.add([...col_lines, ...row_lines])
    this.add(children)
  }
}
