import { describe, expect, it } from 'vitest'
import { BEACON_HEIGHT, generateCityscape, seededRandom } from './cityscape.ts'

describe('seededRandom', () => {
  it('repeats exactly for the same seed and stays in 0..1', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    for (let i = 0; i < 100; i += 1) {
      const value = a()
      expect(value).toBe(b())
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('differs between seeds', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)())
  })
})

describe('generateCityscape', () => {
  const city = generateCityscape()

  it('is the same skyline on every load', () => {
    expect(generateCityscape()).toEqual(city)
  })

  it('fills the whole width in every layer', () => {
    for (const layer of ['far', 'mid', 'near'] as const) {
      const layerBuildings = city.buildings.filter((building) => building.layer === layer)
      const right = Math.max(...layerBuildings.map((building) => building.x + building.width))
      expect(Math.min(...layerBuildings.map((building) => building.x))).toBeLessThanOrEqual(0)
      expect(right).toBeGreaterThanOrEqual(1)
    }
  })

  it('keeps every lit window inside its building', () => {
    for (const building of city.buildings) {
      for (const window of building.windows) {
        expect(window.x).toBeGreaterThanOrEqual(building.x)
        expect(window.x).toBeLessThanOrEqual(building.x + building.width)
        expect(window.y).toBeLessThan(building.height)
      }
    }
  })

  it('lights only some windows, so it reads as night, not an office at noon', () => {
    const lit = city.buildings.reduce((sum, building) => sum + building.windows.length, 0)
    expect(lit).toBeGreaterThan(50)
    expect(lit).toBeLessThan(2500)
  })

  it('puts a beacon only on the tall towers', () => {
    for (const building of city.buildings) expect(building.beacon).toBe(building.height > BEACON_HEIGHT)
  })

  it('scatters street lights along the foot of the skyline', () => {
    expect(city.streetLights.length).toBeGreaterThan(10)
    for (const light of city.streetLights) expect(light.y).toBeLessThan(0.12)
  })
})
