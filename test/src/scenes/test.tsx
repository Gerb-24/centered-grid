import { makeScene2D, Rect } from "@motion-canvas/2d"
import { all, createRef, sequence, waitFor } from "@motion-canvas/core"
import { GridCell, CenteredGridProps } from "../../../src/CenteredGrid"
import { CenteredGridWithGridlines } from "../../../src/CenteredGridWithGridlines"

interface Settings {
  grid: CenteredGridProps,
}

const settings: Settings = {
  grid: {
    manager: {
      columnAmount: 6,
      rowAmount: 6,
      columnDefaultWidth: 150,
      rowDefaultWidth: 150,
      // alwaysUseDefault: true
    },
    showCoords: true,
    lineWidth: 2,
    radius: 20,
    clip: true
  }
}

export default makeScene2D(function*(view) {
  view.fill('white')

  const redCell = createRef<GridCell>()
  const yellowCell = createRef<GridCell>()
  const greenCell = createRef<GridCell>()
  const pinkCell = createRef<GridCell>()

  view.add(
    <CenteredGridWithGridlines
      {...settings.grid} >
      <GridCell ref={redCell} coord={[2, 1]}>
        <Rect size={100} fill={'red'} />
      </GridCell>
      <GridCell ref={yellowCell} coord={[3, 3]}>
        <Rect size={100} fill={'yellow'} />
      </GridCell>
      <GridCell ref={greenCell} coord={[[4, 2], [5, 3]]}>
        <Rect size={100} fill={'green'} />
      </GridCell>
      <GridCell ref={pinkCell} coord={[1, 1]}>
        <Rect size={200} fill={'pink'} />
      </GridCell>
    </CenteredGridWithGridlines>
  )


  const grid = new CenteredGridWithGridlines({
    ...settings.grid,
    scale: 0.7,
    children: [redCell, yellowCell, greenCell, pinkCell]
  })
  view.add(grid)

  const redBox = redCell().layout
  const yellowBox = yellowCell().layout


  yield* waitFor(1)
  yield* sequence(0.2,
    redBox.size([200, 300], 1),
    yellowBox.size([200, 300], 1),
    pinkCell().layout.size([400, 200], 1))

  const orangeCell = new GridCell({
    coord: [1, 3], effect: 0, children: [new Rect({ fill: 'orange', scale: 0, size: [400, 400] })
    ]
  })

  const orangeBox = orangeCell.layout
  grid.add(orangeCell)

  yield* waitFor(1)
  yield* sequence(0.2, redCell().coord([4, 4], 1).to([1, 5], 1),
    greenCell().coord([3, 5], 1),
    pinkCell().coord([[2, 0], [3, 1]], 1),
    yellowBox.size([300, 200], 1),
    all(orangeCell.effect(1, 3), orangeBox.scale(1, 3))
  )

  yield* waitFor(1)

  yield* sequence(0.2, yellowBox.size([100, 100], 1),
    redBox.size([100, 100], 1),
    orangeBox.size([100, 100], 1),
    pinkCell().layout.size([200, 200], 1)
  )

  yield* waitFor(1)

})




