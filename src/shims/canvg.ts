const canvgStub = {
  fromString() {
    throw new Error('SVG-to-PDF rendering is not enabled in this build.')
  },
}

export const Canvg = canvgStub
export default canvgStub
