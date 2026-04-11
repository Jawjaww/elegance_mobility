// Déclarations globales pour imports non-TS (CSS, images, etc.)
declare module "*.css";
declare module "*.scss";
declare module "*.module.css";
declare module "*.module.scss";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";

// Cas particulier pour certains paquets qui exposent des fichiers CSS
declare module "maplibre-gl/dist/maplibre-gl.css";
