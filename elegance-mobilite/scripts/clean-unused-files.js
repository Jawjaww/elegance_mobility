#!/usr/bin/env node

/**
 * Ce script analyse votre projet pour identifier les fichiers potentiellement inutilisés
 * et vous permet de les supprimer facilement.
 * 
 * Usage: node scripts/clean-unused-files.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurations
const config = {
  // Répertoires à analyser
  srcDirs: ['src', 'lib', 'components'],
  // Extensions de fichiers à considérer
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  // Fichiers ou répertoires à ignorer
  ignore: [
    'node_modules',
    '.next',
    'pages/_app.tsx',
    'pages/index.tsx',
    'pages/_document.tsx',
  ],
  // Racine du projet
  rootDir: path.resolve(__dirname, '..'),
};

// Interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour trouver tous les fichiers dans les répertoires spécifiés
function findAllFiles(dir, fileList = [], basePath = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!config.ignore.includes(file)) {
        findAllFiles(filePath, fileList, relativePath);
      }
    } else {
      const ext = path.extname(file);
      if (config.extensions.includes(ext) && !config.ignore.includes(relativePath)) {
        fileList.push({
          fullPath: filePath,
          relativePath: relativePath,
        });
      }
    }
  });
  
  return fileList;
}

// Fonction pour extraire les importations d'un fichier
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*from\s+['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Fonction pour normaliser les chemins d'importation
function normalizeImportPath(importPath) {
  // Gérer les importations relatives
  if (importPath.startsWith('.')) {
    return path.normalize(importPath);
  }
  
  // Gérer les importations absolues (avec alias)
  if (importPath.startsWith('@/')) {
    return importPath.replace('@/', 'src/');
  }
  
  // Ignorer les modules externes
  return null;
}

// Fonction principale
async function main() {
  console.log('🧹 Analyse des fichiers inutilisés en cours...');
  
  // Trouver tous les fichiers du projet
  let allFiles = [];
  for (const srcDir of config.srcDirs) {
    const dirPath = path.join(config.rootDir, srcDir);
    if (fs.existsSync(dirPath)) {
      allFiles = allFiles.concat(findAllFiles(dirPath, [], srcDir));
    }
  }
  
  console.log(`📝 ${allFiles.length} fichiers trouvés au total.`);
  
  // Créer un index des imports
  const importedFiles = new Set();
  for (const file of allFiles) {
    const imports = extractImports(file.fullPath);
    for (const importPath of imports) {
      const normalizedPath = normalizeImportPath(importPath);
      if (normalizedPath) {
        // Ajouter avec différentes extensions possibles
        importedFiles.add(normalizedPath);
        importedFiles.add(normalizedPath + '.ts');
        importedFiles.add(normalizedPath + '.tsx');
        importedFiles.add(normalizedPath + '.js');
        importedFiles.add(normalizedPath + '.jsx');
        // Gérer les imports de répertoires avec index
        importedFiles.add(normalizedPath + '/index.ts');
        importedFiles.add(normalizedPath + '/index.tsx');
        importedFiles.add(normalizedPath + '/index.js');
        importedFiles.add(normalizedPath + '/index.jsx');
      }
    }
  }
  
  // Trouver les fichiers potentiellement inutilisés
  const unusedFiles = allFiles.filter(file => {
    // Vérifier différentes variantes du chemin de fichier
    const fileWithoutExt = file.relativePath.replace(/\.\w+$/, '');
    const isImported = importedFiles.has(file.relativePath) || importedFiles.has(fileWithoutExt);
    return !isImported;
  });
  
  if (unusedFiles.length === 0) {
    console.log('✅ Aucun fichier inutilisé trouvé!');
    process.exit(0);
  }
  
  console.log(`\n🚨 ${unusedFiles.length} fichiers potentiellement inutilisés trouvés:`);
  
  // Afficher les fichiers inutilisés
  unusedFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.relativePath}`);
  });
  
  // Demander confirmation pour la suppression
  rl.question('\nSouhaitez-vous supprimer ces fichiers? (y/n/select): ', answer => {
    if (answer.toLowerCase() === 'y') {
      // Supprimer tous les fichiers
      unusedFiles.forEach(file => {
        fs.unlinkSync(file.fullPath);
        console.log(`✅ Supprimé: ${file.relativePath}`);
      });
      console.log(`\n🎉 ${unusedFiles.length} fichiers inutilisés ont été supprimés.`);
      rl.close();
    } else if (answer.toLowerCase() === 'select') {
      // Sélection manuelle des fichiers à supprimer
      selectFilesToDelete(unusedFiles);
    } else {
      console.log('❌ Opération annulée');
      rl.close();
    }
  });
}

// Fonction pour sélectionner manuellement les fichiers à supprimer
function selectFilesToDelete(unusedFiles, index = 0, filesToDelete = []) {
  if (index >= unusedFiles.length) {
    // Fin de la sélection, supprimer les fichiers sélectionnés
    if (filesToDelete.length === 0) {
      console.log('❌ Aucun fichier sélectionné pour la suppression');
      rl.close();
      return;
    }
    
    filesToDelete.forEach(file => {
      fs.unlinkSync(file.fullPath);
      console.log(`✅ Supprimé: ${file.relativePath}`);
    });
    
    console.log(`\n🎉 ${filesToDelete.length} fichiers inutilisés ont été supprimés.`);
    rl.close();
    return;
  }
  
  const file = unusedFiles[index];
  rl.question(`Supprimer ${file.relativePath}? (y/n): `, answer => {
    if (answer.toLowerCase() === 'y') {
      filesToDelete.push(file);
    }
    selectFilesToDelete(unusedFiles, index + 1, filesToDelete);
  });
}

// Lancer le script
main().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});
