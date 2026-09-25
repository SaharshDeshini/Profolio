import { describe, expect, it } from 'vitest'
import { sampleCameraPose } from '../cameraPath.ts'
import { dockedCamera } from '../dock.ts'
import { DESK, LAPTOP, READING_LAMP, ROOM, SEAT } from './dimensions.ts'

// These pin the relationships between the measurements, not the numbers
// themselves, so re-fitting the room to the real character model cannot
// quietly leave the laptop floating or the camera outside a wall.
describe('desk and laptop', () => {
  it('puts the laptop wholly on the desk top', () => {
    const deskNearEdge = DESK.centerZ - DESK.depth / 2
    const deskFarEdge = DESK.centerZ + DESK.depth / 2
    expect(LAPTOP.z - LAPTOP.depth / 2).toBeGreaterThan(deskNearEdge)
    expect(LAPTOP.z + LAPTOP.depth / 2).toBeLessThan(deskFarEdge)
    expect(LAPTOP.width).toBeLessThan(DESK.width)
  })

  it('fits the screen inside the lid', () => {
    expect(LAPTOP.screenWidth).toBeLessThan(LAPTOP.width)
    expect(LAPTOP.screenHeight).toBeLessThan(LAPTOP.depth)
  })

  it('keeps the desk legs taller than zero', () => {
    expect(DESK.topY - DESK.thickness).toBeGreaterThan(0)
  })
})

describe('desk and seat', () => {
  it('puts the seat behind the desk edge, so the person can slide in', () => {
    const deskNearEdge = DESK.centerZ - DESK.depth / 2
    expect(SEAT.z + SEAT.depth / 2).toBeLessThan(deskNearEdge)
  })

  it('sets the desk at a working height above a real seat height', () => {
    expect(DESK.topY).toBeGreaterThanOrEqual(0.68)
    expect(DESK.topY).toBeLessThanOrEqual(0.78)
    expect(SEAT.y).toBeGreaterThanOrEqual(0.4)
    expect(SEAT.y).toBeLessThanOrEqual(0.5)
    expect(DESK.topY - SEAT.y).toBeGreaterThanOrEqual(0.25)
    expect(DESK.topY - SEAT.y).toBeLessThanOrEqual(0.32)
  })
})

describe('room', () => {
  it('keeps the whole camera flight inside the walls, floor and ceiling', () => {
    const margin = 0.5
    for (let i = 0; i <= 400; i++) {
      const [x, y, z] = sampleCameraPose(i / 400).position
      expect(Math.abs(x), `x at ${i}`).toBeLessThan(ROOM.width / 2 - margin)
      expect(Math.abs(z), `z at ${i}`).toBeLessThan(ROOM.depth / 2 - margin)
      expect(y, `y at ${i}`).toBeGreaterThan(0)
      expect(y, `y at ${i}`).toBeLessThan(ROOM.height - margin)
    }
  })

  it('puts the desk and chair inside the room with space to walk round', () => {
    expect(DESK.width).toBeLessThan(ROOM.width - 2)
    expect(DESK.depth).toBeLessThan(ROOM.depth - 2)
  })
})

describe('READING_LAMP', () => {
  const inFrame = (aspect: number, point: readonly [number, number, number]) => {
    const camera = dockedCamera(aspect)
    const offset = [0, 1, 2].map((i) => (point[i] ?? 0) - (camera.position[i] ?? 0))
    const dotWith = (axis: readonly number[]) => offset.reduce((sum, value, i) => sum + value * (axis[i] ?? 0), 0)
    const depth = dotWith(camera.forward)
    const half = Math.tan((camera.fov * Math.PI) / 360)
    const x = dotWith(camera.right) / (depth * half * camera.aspect)
    const y = dotWith(camera.up) / (depth * half)
    return depth > 0 && Math.abs(x) <= 1 && Math.abs(y) <= 0.95
  }

  it('stands fully inside the docked frame, base to shade, on common desktop shapes', () => {
    for (const aspect of [16 / 10, 16 / 9, 3 / 2]) {
      expect(inFrame(aspect, [READING_LAMP.x, 0, READING_LAMP.z])).toBe(true)
      expect(inFrame(aspect, [READING_LAMP.x, READING_LAMP.height, READING_LAMP.z])).toBe(true)
    }
  })
})
