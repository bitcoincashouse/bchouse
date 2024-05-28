export const runtimeTemplate = `export const routes = {
  <% routes.forEach(({ route, params, fileName }) => { %>"<%- route %>": () => import('<%- relativeAppDirPath %>/<%- fileName %>'),
  <% }) %>  
}`
