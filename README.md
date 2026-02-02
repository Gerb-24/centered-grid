# Centered Grid Component

So I made this component because I did not like a couple of things when working with `Layout`:
1. You can make a grid by using layouts inside a layout, 
but you cannot eaily move from one place in the grid to another, 
in such a way that the layout updates smoothly (without a lot of pain)
2. You cant easily add an item to a layout, so that it updates smoothly around its contents

So the `CenteredGrid` aims to solve these problems, with a nice declaritive syntax!


## Example
Note that this does not work with tsx yet, somehow adding children later on break.
Feel free to fix it :p

```tsx
import { makeScene2D, Rect } from "@motion-canvas/2d"
import { all, sequence, waitFor } from "@motion-canvas/core"
import { GridCell, CenteredGridProps } from "@gerb-24/centered-grid"
import { CenteredGridWithGridlines } from "@gerb-24/centered-grid"


export const NordeTheme = {
  PolarNight0: '#2E3440',
  PolarNight1: '#3B4252',
  PolarNight2: '#434C5E',
  PolarNight3: '#4C566A',
  SnowStorm0: '#D8DEE9',
  SnowStorm1: '#E5E9F0',
  SnowStorm2: '#ECEFF4',
  Frost0: '#8FBCBB',
  Frost1: '#88C0D0',
  Frost2: '#81A1C1',
  Frost3: '#5E81AC',
  Aurora0: '#BF616A',
  Aurora1: '#D08770',
  Aurora2: '#EBCB8B',
  Aurora3: '#A3BE8C',
  Aurora4: '#B48EAD',
}

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
    // showCoords: true,
    // showCoordsFill: NordeTheme.SnowStorm2,
    // showCoordsStroke: NordeTheme.PolarNight0,
    stroke: NordeTheme.PolarNight0,
    lineWidth: 2,
    radius: 20,
    clip: true
  }
}

export default makeScene2D(function*(view) {
  view.fill(NordeTheme.SnowStorm0)

  // setting up
  const redCell = new GridCell({
    coord: [2, 1], children: [
      new Rect({ fill: NordeTheme.Aurora0, stroke: NordeTheme.PolarNight0, lineWidth: 2, radius: 10, size: 100 })
    ]
  })
  const yellowCell = new GridCell({
    coord: [3, 3], children: [
      new Rect({ fill: NordeTheme.Aurora1, stroke: NordeTheme.PolarNight0, lineWidth: 2, radius: 10, size: 100 })
    ]
  })
  const greenCell = new GridCell({
    coord: [1, 1], children: [
      new Rect({ fill: NordeTheme.Aurora2, stroke: NordeTheme.PolarNight0, lineWidth: 2, radius: 10, size: 100 })
    ]
  })
  const pinkCell = new GridCell({
    coord: [[4, 2], [5, 3]], children: [
      new Rect({ fill: NordeTheme.Aurora3, stroke: NordeTheme.PolarNight0, lineWidth: 2, radius: 10, size: 200 })
    ]
  })

  const grid = new CenteredGridWithGridlines({
    ...settings.grid,
    scale: 0.7,
    children: [redCell, yellowCell, greenCell, pinkCell]
  })
  view.add(grid)

  const redBox = redCell.layout
  const yellowBox = yellowCell.layout

  yield* waitFor(1)
  yield* sequence(0.2,
    redBox.size([200, 300], 1),
    yellowBox.size([200, 300], 1),
    pinkCell.layout.size([400, 200], 1))

  const orangeCell = new GridCell({
    coord: [1, 3], effect: 0, children: [
      new Rect({ fill: NordeTheme.Aurora4, stroke: NordeTheme.PolarNight0, lineWidth: 2, radius: 10, size: 400, scale: 0 })
    ]
  })

  const orangeBox = orangeCell.layout
  grid.add(orangeCell)

  yield* waitFor(1)
  yield* sequence(0.2, redCell.coord([4, 4], 1).to([1, 5], 1),
    greenCell.coord([3, 5], 1),
    pinkCell.coord([[2, 0], [3, 1]], 1),
    yellowBox.size([300, 200], 1),
    all(orangeCell.effect(1, 1), orangeBox.scale(1, 1))
  )

  yield* waitFor(1)

  yield* sequence(0.2, yellowBox.size([100, 100], 1),
    redBox.size([100, 100], 1),
    orangeBox.size([100, 100], 1),
    pinkCell.layout.size([200, 200], 1)
  )

  yield* waitFor(1)

})
```

## How to set it up

This is currently not yet registered to npm,
so to make use of it you can clone the repository with 
`git clone <url to this repo>`, and then run `npm install` in you cloned version
to get all the dependencies, then build the package with `npm run build`.
You can then use it in your other motion-canvas projects by running `npm install <path to the cloned repo>`
-- this will add a link to this repo in your project. You can then import the components with 
```tsx
import {CenteredGrid} from '@gerb-24/centered-grid'
```

Note that if you also have a cloned version of motion-canvas that you make use of, or another fork like canvas-commons
then you will probably need to change the (peer)dependencies in the package.json and run `npm run build` again.

Whenever I will add some things to this repository, then you can just pull the latest changes into your cloned version.
I will probably send a message somewhere in the motion-canvas discord.
