import { RegexParameters } from "types";

import { getInvalidRegexError } from "errors/getInvalidRegexError";

import { isRegexInvalid } from "helpers/isRegexInvalid";

import { applyRegexParameters } from "rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/validateName/helpers/applyRegexParameters";
import {
  DOT_CHARACTER_REGEX,
  WILDCARD_REGEX,
} from "rules/folderStructure/helpers/validateFolderStructure/helpers/validatePath/helpers/validateName/validateName.consts";

export interface ValidateNameProps {
  nodeName: string;
  ruleName: string;
  folderName: string;
  regexParameters?: RegexParameters;
}

export const validateName = ({
  nodeName,
  ruleName,
  folderName,
  regexParameters,
}: ValidateNameProps): boolean => {
  const regexImproved = ruleName
    .replaceAll(".", DOT_CHARACTER_REGEX)
    .replaceAll(`${DOT_CHARACTER_REGEX}${DOT_CHARACTER_REGEX}`, ".")
    .replaceAll("*", WILDCARD_REGEX)
    .replaceAll(`*${WILDCARD_REGEX}`, "*");

  if (isRegexInvalid(regexImproved)) throw getInvalidRegexError(regexImproved);

  const regexWithRegexParameters = applyRegexParameters({
    regex: regexImproved,
    folderName,
    regexParameters,
  });

  const finalRegex = new RegExp(`^${regexWithRegexParameters}$`, "g");

  return finalRegex.test(nodeName);
};