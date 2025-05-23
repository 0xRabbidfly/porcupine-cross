export function initInteractiveMap(app) {
  try {
    app.components.interactiveMap = app.InteractiveMap.createFromSelectors();
  } catch (error) {
    console.error('Error creating InteractiveMap:', error);
  }
}
