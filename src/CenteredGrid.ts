import { ComponentChild, ComponentChildren, computed, initial, Latex, Layout, Node, NodeProps, Rect, RectProps, signal } from "@motion-canvas/2d"
import { createSignal, easeInOutCubic, PossibleColor, range, SignalValue, SimpleSignal, TimingFunction, useLogger, Vector2 } from "@motion-canvas/core"

class GridArrayCell {
  public width: SimpleSignal<number>
  public effect: SimpleSignal<number>

  constructor(width: SimpleSignal<number>, effect: SimpleSignal<number>) {
    this.width = width
    this.effect = effect
  }
}

class GridArray {
  public cells: SimpleSignal<GridArrayCell[]> = createSignal([])

  // we set these in the gridArrayManager
  // the min_width computed then gives you the actual min_width
  public minWidthFromStart: SimpleSignal<number> = createSignal(0)
  public minWidthFromEnd: SimpleSignal<number> = createSignal(0)

  constructor() { }


  @computed()
  public min_width() {
    return Math.min(this.minWidthFromStart(), this.minWidthFromEnd())
  }

  @computed()
  public getMaxWidth() {
    let orderedWithsWithEffect: [number, number][] = this.cells()
      .map(cell => [cell.width(), cell.effect()])
      .filter((pair) => pair[0] > this.min_width()) as [number, number][]
    orderedWithsWithEffect.sort((a, b) => a[0] - b[0])

    const result = orderedWithsWithEffect.reduce((acc, curr) => (curr[0] - acc) * curr[1] + acc, this.min_width())
    return result
  }

  @computed()
  public getMaxEffect() {
    return Math.max(0, ...this.cells().map(cell => cell.effect()))
  }
}

class GridArrayManager {
  public arrays: GridArray[] = []
  public defaultWidth: number = 100
  public alwaysUseDefault: boolean

  constructor(amount: number, defaultWidth: number, alwaysUseDefault: boolean) {
    this.defaultWidth = defaultWidth
    this.alwaysUseDefault = alwaysUseDefault
    // initial wiring
    range(amount).forEach(_ => {
      this.arrays.push(new GridArray())
    })

    // setting the min width from start
    range(amount).forEach(i => {
      this.arrays[i].minWidthFromStart(() => this.computeMinWidthFromStart(i))
    })

    // setting the min width from end
    range(amount).forEach(i => {
      const index = this.arrays.length - 1 - i
      this.arrays[index].minWidthFromEnd(() => this.computeMinWidthFromEnd(index))
    })
  }

  @computed()
  public getTotalWidth(): number {
    let totalWidth = 0
    this.arrays.forEach(arr => totalWidth += arr.getMaxWidth())
    return totalWidth
  }

  @computed()
  public getPositions(): number[] {
    const totalWidth = this.getTotalWidth()
    let result: number[] = [];
    range(this.arrays.length).forEach(i => {
      const width = this.arrays[i].getMaxWidth()
      if (i === 0) {
        result[i] = -1 * totalWidth / 2
      }
      else {
        result[i] += result[i - 1]
      }
      result[i] += width / 2
      if (i != this.arrays.length - 1) {
        result[i + 1] = width / 2
      }
    })
    return result
  }

  @computed()
  public getCornerPositions(): number[] {
    const totalWidth = this.getTotalWidth()
    let result: number[] = [-1 * totalWidth / 2];
    range(this.arrays.length).forEach(i => {
      result[i + 1] = result[i] + this.arrays[i].getMaxWidth()
    })
    return result
  }

  @computed()
  private computeMinWidthFromStart(index: number) {
    if (this.alwaysUseDefault) {
      return this.defaultWidth
    }
    if (index === 0) {
      return this.defaultWidth * this.arrays[index].getMaxEffect();
    }
    const prev_default = this.arrays[index - 1].minWidthFromStart()
    const prev_effect = this.arrays[index - 1].getMaxEffect()
    const cur_effect = this.arrays[index].getMaxEffect()
    const new_default_from_prev = (prev_effect) * this.defaultWidth + (1 - prev_effect) * prev_default
    const new_default = this.defaultWidth * cur_effect + (1 - cur_effect) * new_default_from_prev
    return new_default
  }

  @computed()
  private computeMinWidthFromEnd(index: number) {
    if (this.alwaysUseDefault) {
      return this.defaultWidth
    }
    if (index === this.arrays.length - 1) {
      return this.defaultWidth * this.arrays[index].getMaxEffect();
    }
    const prev_default = this.arrays[index + 1].minWidthFromEnd()
    const prev_effect = this.arrays[index + 1].getMaxEffect()
    const cur_effect = this.arrays[index].getMaxEffect()
    const new_default_from_prev = (prev_effect) * this.defaultWidth + (1 - prev_effect) * prev_default
    const new_default = this.defaultWidth * cur_effect + (1 - cur_effect) * new_default_from_prev
    return new_default
  }
}

export interface GridManagerProps {
  columnAmount: number,
  rowAmount: number,
  columnDefaultWidth?: number,
  rowDefaultWidth?: number,
  alwaysUseDefault?: boolean,
}

export class GridManager {
  public columnAmount: number;
  public rowAmount: number;
  public columnDefaultWidth: number = 100;
  public rowDefaultWidth: number = 100;
  private columnManager: GridArrayManager;
  private rowManager: GridArrayManager;

  constructor(props: GridManagerProps) {
    this.columnAmount = props.columnAmount
    this.rowAmount = props.rowAmount
    this.columnDefaultWidth = props.columnDefaultWidth
    this.rowDefaultWidth = props.rowDefaultWidth

    // initializing the row and column managers
    this.columnManager = new GridArrayManager(this.columnAmount, this.columnDefaultWidth, props.alwaysUseDefault ?? false)
    this.rowManager = new GridArrayManager(this.rowAmount, this.rowDefaultWidth, props.alwaysUseDefault ?? false)

  }

  @computed()
  public getPosition(colIndex: number, rowIndex: number): Vector2 {
    return new Vector2([
      this.columnManager.getPositions()[colIndex],
      this.rowManager.getPositions()[rowIndex]
    ])
  }

  @computed()
  public getTotalWidth() {
    return this.columnManager.getTotalWidth()
  }

  public getTotalHeight() {
    return this.rowManager.getTotalWidth()
  }

  @computed()
  public getCornerPosition(colIndex: number, rowIndex: number): [number, number] {
    return [
      this.columnManager.getCornerPositions()[colIndex],
      this.rowManager.getCornerPositions()[rowIndex]
    ]
  }

  public addCell(columnCell: GridArrayCell, rowCell: GridArrayCell, colIndex: number, rowIndex: number) {
    const columns = this.columnManager.arrays[colIndex].cells()
    this.columnManager.arrays[colIndex].cells([...columns, columnCell])

    const rows = this.rowManager.arrays[rowIndex].cells()
    this.rowManager.arrays[rowIndex].cells([...rows, rowCell])
  }

  public removeCell(columnCell: GridArrayCell, rowCell: GridArrayCell, colIndex: number, rowIndex: number) {
    const columnCells = this.columnManager.arrays[colIndex].cells()
    this.columnManager.arrays[colIndex].cells(columnCells.filter(cell => cell !== columnCell))

    const rowCells = this.rowManager.arrays[rowIndex].cells()
    this.rowManager.arrays[rowIndex].cells(rowCells.filter(cell => cell !== rowCell))
  }
}

export interface CenteredGridProps extends RectProps {
  manager: GridManagerProps,
  showCoords?: boolean
  showCoordsFill?: PossibleColor
  showCoordsStroke?: PossibleColor
}

export class CenteredGrid extends Rect {
  public manager: GridManager;
  public showCoords: boolean;
  public showCoordsFill: PossibleColor;
  public showCoordsStroke: PossibleColor;
  constructor(props: CenteredGridProps) {
    super(props)
    this.manager = new GridManager(props.manager)
    this.width(() => this.manager.getTotalWidth())
    this.height(() => this.manager.getTotalHeight())

    this.showCoords = props.showCoords ?? false
    this.showCoordsFill = props.showCoordsFill ?? 'white'
    this.showCoordsStroke = props.showCoordsStroke ?? 'black'
    const cells = this.getChildren()
    cells.forEach(cell => {
      if (isGridCell(cell)) {
        cell.setup(this)
      }
    })
  }

  public override insert(node: ComponentChildren, index = 0): this {

    const array = (Array.isArray(node) ? node : [node]);
    if (array.length === 0) {
      return this;
    }
    array.forEach(cell => {
      if (isGridCell(cell)) {
        cell.setup(this)
      }
    })

    return super.insert(node, index);
  }
}

function isGridCell(node: ComponentChild): node is GridCell {
  return (node as GridCell).setup !== undefined
}

export interface GridCellProps extends NodeProps {
  coord: SignalValue<[number, number] | [[number, number], [number, number]]>
  effect?: SignalValue<number>
}

export class GridCell extends Node {
  private grid: CenteredGrid
  public layout: Layout
  private rowCel: GridArrayCell
  private colCel: GridArrayCell
  private prevRowCel: GridArrayCell
  private prevColCel: GridArrayCell
  private previousCoord: [[number, number], [number, number]]

  @signal()
  public declare readonly coord: SimpleSignal<[number, number] | [[number, number], [number, number]]>

  @initial(1)
  @signal()
  public declare readonly effect: SimpleSignal<number>

  private shift = createSignal(1)
  private combinedEffect: SimpleSignal<number>
  private combinedReverseEffect: SimpleSignal<number>

  constructor(props: GridCellProps) {
    super(props)
    this.layout = this.childAs<Layout>(0)
    this.combinedEffect = createSignal(() => this.shift() * this.effect())
    this.combinedReverseEffect = createSignal(() => (1 - this.shift() * this.effect()))
  }

  // we map a coord to an interval
  @computed()
  private parsedCoord(): [[number, number], [number, number]] {
    const coord = this.coord()
    if (this.isSpan(coord)) {
      return coord
    }
    return [coord, coord]
  }

  private isSpan(coord: [number, number] | [[number, number], [number, number]]): coord is [[number, number], [number, number]] {
    return Array.isArray(coord[0])
  }

  @computed()
  private getSpanLengths(): [number, number] {
    const span = this.parsedCoord()
    const result = [span[1][0] - span[0][0] + 1, span[1][1] - span[0][1] + 1]
    return result as [number, number]
  }

  @computed()
  private getDividedSize(): [number, number] {
    const [colSpan, rowSpan] = this.getSpanLengths()
    const [width, height] = this.layout.size()
    return [width / colSpan, height / rowSpan]
  }

  public setup(grid: CenteredGrid) {
    this.grid = grid
    this.colCel = new GridArrayCell(createSignal(() => this.getDividedSize()[0]), createSignal(() => this.combinedEffect()))
    this.rowCel = new GridArrayCell(createSignal(() => this.getDividedSize()[1]), createSignal(() => this.combinedEffect()))
    const coord = this.parsedCoord()
    const callbacks: (() => Vector2)[] = []
    range(coord[0][0], coord[1][0] + 1).forEach(col => {
      range(coord[0][1], coord[1][1] + 1).forEach(row => {
        this.grid.manager.addCell(this.colCel, this.rowCel, col, row)
        callbacks.push(() => this.grid.manager.getPosition(col, row))
      })
    })

    // apply the position
    const [colSpan, rowSpan] = this.getSpanLengths()
    this.position(() => callbacks.map(cb => cb()).reduce((acc, curr) => acc.add(curr), new Vector2(0, 0)).div(colSpan * rowSpan))

    // set the coord latex
    if (grid.showCoords) {
      const coordTex = new Latex({
        tex: () => this.coordToTex(),
        fill: grid.showCoordsStroke,
        fontSize: 20
      })
      const wrapper = new Rect({
        padding: 10,
        layout: true,
        lineWidth: 2,
        fill: grid.showCoordsFill,
        stroke: grid.showCoordsStroke,
        radius: 10,
        children: [coordTex]
      })

      this.add(wrapper)
    }

  }

  @computed()
  private coordToTex(): string {
    const coord = this.coord()
    if (this.isSpan(coord)) {
      return `{{\\big((${coord[0][0]}, ${coord[0][1]}),(${coord[1][0]}, ${coord[1][1]})\\big)}}`
    }
    return `{{(${coord[0]}, ${coord[1]})}}`

  }

  public * tweenCoord(value: SignalValue<[number, number] | [[number, number], [number, number]]>,
    duration: number,
    timingFunction: TimingFunction = easeInOutCubic
  ) {
    //clean up from previous tween
    if (this.prevColCel !== null
      && this.prevRowCel !== null
      && this.previousCoord) {
      const coord = this.previousCoord
      range(coord[0][0], coord[1][0] + 1).forEach(col => {
        range(coord[0][1], coord[1][1] + 1).forEach(row => {
          this.grid.manager.removeCell(this.prevColCel, this.prevRowCel, col, row)
        })
      })
    }
    this.colCel.effect(createSignal(() => this.combinedEffect()))
    this.rowCel.effect(createSignal(() => this.combinedEffect()))
    this.shift(1)

    this.previousCoord = this.parsedCoord()
    this.coord(value)
    const curr_coord = this.parsedCoord()
    this.prevColCel = this.colCel
    this.prevRowCel = this.rowCel
    this.colCel = new GridArrayCell(createSignal(() => this.getDividedSize()[0]), createSignal(() => this.combinedReverseEffect()))
    this.rowCel = new GridArrayCell(createSignal(() => this.getDividedSize()[1]), createSignal(() => this.combinedReverseEffect()))

    const curr_callbacks: (() => Vector2)[] = []
    range(curr_coord[0][0], curr_coord[1][0] + 1).forEach(col => {
      range(curr_coord[0][1], curr_coord[1][1] + 1).forEach(row => {
        this.grid.manager.addCell(this.colCel, this.rowCel, col, row)
        curr_callbacks.push(() => this.grid.manager.getPosition(col, row))
      })
    })
    const [colSpan, rowSpan] = this.getSpanLengths()
    const curr_average: () => Vector2 = () =>
      curr_callbacks
        .map(cb => cb())
        .reduce((acc, curr) => acc.add(curr), new Vector2(0, 0))
        .div(colSpan * rowSpan)

    const prev = this.previousCoord
    const prev_callbacks: (() => Vector2)[] = []
    range(prev[0][0], prev[1][0] + 1).forEach(col => {
      range(prev[0][1], prev[1][1] + 1).forEach(row => {
        prev_callbacks.push(() => this.grid.manager.getPosition(col, row))
      })
    })
    const prev_average: () => Vector2 = () =>
      prev_callbacks
        .map(cb => cb())
        .reduce((acc, curr) => acc.add(curr), new Vector2(0, 0))
        .div(colSpan * rowSpan)

    // apply the position
    this.position(() =>
      curr_average()
        .mul(1 - this.shift())
        .add(
          prev_average()
            .mul(this.shift())
        )
    )
    yield* this.shift(0, duration, timingFunction)

  }
}
