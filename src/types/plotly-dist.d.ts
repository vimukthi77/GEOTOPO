declare module 'plotly.js-dist-min' {
  const Plotly: any;
  export default Plotly;
}

declare module 'react-plotly.js/factory' {
  const createPlotlyComponent: (Plotly: any) => any;
  export default createPlotlyComponent;
}
