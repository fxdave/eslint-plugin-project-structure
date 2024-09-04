import {
  Rule,
  FolderStructureConfig,
} from "rules/folderStructure/folderStructure.types";
import { getRule } from "rules/folderStructure/helpers/getRule";
import { filterRulesByType } from "rules/folderStructure/helpers/validateChildren/helpers/filterRulesByType";
import { getNextPathname } from "rules/folderStructure/helpers/validateChildren/helpers/getNextPathname";
import { removeRuleReplicatesFromChildren } from "rules/folderStructure/helpers/validateChildren/helpers/removeRuleReplicatesFromChildren";
import { sortChildrenByNameType } from "rules/folderStructure/helpers/validateChildren/helpers/sortChildrenByNameType";
import { validateRulesList } from "rules/folderStructure/helpers/validateChildren/helpers/validateRulesList";

interface ValidateChildrenProps {
  pathname: string;
  filenameWithoutCwd: string;
  nodeName: string;
  children: Rule[];
  config: FolderStructureConfig;
  cwd: string;
}

export const validateChildren = ({
  pathname,
  filenameWithoutCwd,
  nodeName,
  children,
  config,
  cwd,
}: ValidateChildrenProps): void => {
  const childrenWithRules = children.map((rule) =>
    getRule({ rule, rules: config.rules }),
  );

  const childrenWithoutReplicatedRules =
    removeRuleReplicatesFromChildren(childrenWithRules);

  const sortedChildren = sortChildrenByNameType(childrenWithoutReplicatedRules);

  const nextPathname = getNextPathname({ pathname, nodeName });

  const childrenByFileType = sortedChildren.filter((node) =>
    filterRulesByType({
      pathname: nextPathname,
      rule: node,
      rules: config.rules,
    }),
  );

  if (!sortedChildren.length) return;

  validateRulesList({
    pathname: nextPathname,
    filenameWithoutCwd,
    folderName: nodeName,
    nodesList: childrenByFileType,
    config,
    cwd,
  });
};
