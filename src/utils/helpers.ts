import { REGEX } from './regex';

export const indentCodeSnippet = (decodedSnippet: string, indentCount: number): string => {
    const indent = ' ';
    const indentedCodeSnippet = decodedSnippet.replace(REGEX.FIND_EVERY_LINE_START, indent.repeat(indentCount));
    return indentedCodeSnippet;
};

export const createArrayFromMultilineString = (multilineString: string): string[] => {
    return multilineString.split(/\r?\n/);
};

export const createMultilineStringFromArray = (array: string[] | string[][]): string => {
    let multilineString: string = '';
    if (array[0].constructor === Array) {
        (array as string[][]).forEach((stringArray: string[]) => {
            stringArray.forEach((stringElement: string) => {
                multilineString = multilineString.concat(`${stringElement}\n`);
            });
            multilineString = multilineString.concat(`\n`);
        });
    } else {
        (array as string[]).forEach((stringElement: string) => {
            multilineString = multilineString.concat(`${stringElement}\n`);
        });
    }
    return multilineString.trim();
};
