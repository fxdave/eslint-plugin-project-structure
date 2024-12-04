import path from "path";

import { removeProjectRootFromPath } from "rules/independentModules/helpers/validateImport/helpers/validateAll/helpers/removeProjectRootFromPath";

interface ConvertImportPathToNonRelativeProps {
  importPath: string;
  filename: string;
  projectRootWithBaseUrl: string;
}

export const convertImportPathToNonRelative = ({
  projectRootWithBaseUrl,
  filename,
  importPath,
}: ConvertImportPathToNonRelativeProps): string => {
  if (!importPath.startsWith(".")) return importPath;

  const dirname = path.dirname(filename);
  const importPathCleaned = importPath.replace(/^:/, "");

  const fullImportPath1 = path.resolve(dirname, importPathCleaned);
  const fullImportPath2 = path.resolve(
    projectRootWithBaseUrl,
    importPathCleaned,
  );

  let fullImportPath = fullImportPath1;

  if (importPath.startsWith(":")) {
    fullImportPath = fullImportPath2;
  }

  return removeProjectRootFromPath(fullImportPath, projectRootWithBaseUrl);
};
