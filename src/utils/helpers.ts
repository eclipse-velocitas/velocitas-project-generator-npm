import { INDENTATION, PYTHON, VELOCITAS } from './codeConstants';
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

export const removeEmptyLines = (array: string[]): void => {
    const indexesToRemove = new Set<number>();
    array.forEach((e: any, index: any) => {
        if (e === '' && array[index + 1] === '') {
            if (!array[index + 2].includes(PYTHON.CLASS) && !array[index + 2].includes(VELOCITAS.EVENT_LOOP)) {
                indexesToRemove.add(index);
            }
        }
    });
    let indexCountToSubtract: number = 0;
    for (const index of indexesToRemove.values()) {
        array.splice(index - indexCountToSubtract, 1);
        indexCountToSubtract++;
    }
};

export const insertClassDocString = (array: string[], appName: string): void => {
    const vehicleAppClassLine: string = array.find((line: string) => line.includes(VELOCITAS.VEHICLE_APP_SIGNATURE))!;
    array.splice(
        array.indexOf(vehicleAppClassLine) + 1,
        0,
        indentCodeSnippet(`"""Velocitas App for ${appName}."""`, INDENTATION.COUNT_CLASS)
    );
};
