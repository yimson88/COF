declare module 'jspdf/dist/jspdf.umd.min.js' {
  import type { jsPDF } from 'jspdf'

  const mod: {
    jsPDF: typeof jsPDF
  }

  export default mod
}
