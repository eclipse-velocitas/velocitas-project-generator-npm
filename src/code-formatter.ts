import { Buffer } from 'buffer';
import { CONTENT_ENCODINGS } from './constants';

export class CodeFormatter {
    public formatMainPy(base64MainPyContentData: string, base64CodeSnippet: string) {
        try {
            const extractedMainPyStructure = this.extractMainPyBaseStructure(base64MainPyContentData);
            // const formattedCodeSnippet = this.formatCodeSnippet(base64CodeSnippet);
            const formattedMainPy = this.addCodeSnippetToMainPy(extractedMainPyStructure, base64CodeSnippet);
            return formattedMainPy;
        } catch (error) {
            throw new Error('Error in formatMainPy.');
        }
    }

    private extractMainPyBaseStructure(base64MainPyContentData: string) {
        let decodedMainPyContentData = Buffer.from(base64MainPyContentData, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );
        try {
            // Get everything between logger and class
            const rx = /(?<=\_\))[\r\n]+(^[\S\s*]*class)/gm;
            // Get """Sample Vehicle App"""
            const rx2 = /(^\"\"\").*[\r\n]+[\r\n]/gm;
            // Remove all lines with whitespaces followed by # -> comments
            const rx3 = /^(?:[\t ]*(?:\r?|\r).\#.*\n?)+/gm;
            // Everything between multiline
            const rx4 = /(?=\"\"\")[\S\s]*(?<=[\s]\"\"\"$)[\S\s]/gm;
            // Every """ comment
            const rx5 = /^(?:[\t ]*(?:\r?|\r).\"\"\".*\n?)+/gm;
            // Get everything between on_speed_change and "async def main():"
            const rx6 = /(?<=\(self\.on\_speed\_change\))[\r\n]+(^[\S\s*]*async def main\(\)\:)/gm;

            const mainPyBaseStructure = decodedMainPyContentData
                .replace(rx, '\n\nclass')
                .replace(rx2, '')
                .replace(rx3, '')
                .replace(rx4, '')
                .replace(rx5, '')
                .replace(rx6, '\n\nasync def main():');

            return mainPyBaseStructure;
        } catch (error) {
            throw new Error('Error in extractMainPyBaseStructure.');
        }
    }

    private formatCodeSnippet(base64CodeSnippet: string) {
        console.log('Method not implemented.');
    }

    private addCodeSnippetToMainPy(extractedMainPyStructure: string, base64CodeSnippet: string) {
        let decodedBase64CodeSnippet = Buffer.from(base64CodeSnippet, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );
        try {
            // Replace content in on_start method (Here digital.auto code comes in)
            const rx7 = /[\t ]*logger\.info\(\"SampleApp started\.\"\)[\r\n]+([^\r\n]+)/gm;

            const newMainPy = extractedMainPyStructure.replace(rx7, this.indentCodeSnippet(decodedBase64CodeSnippet));
            const encodedNewMainPy = Buffer.from(newMainPy, CONTENT_ENCODINGS.utf8 as BufferEncoding).toString(
                CONTENT_ENCODINGS.base64 as BufferEncoding
            );
            return encodedNewMainPy;
        } catch (error) {
            throw new Error('Error in addCodeSnippetToMainPy.');
        }
    }

    private indentCodeSnippet(decodedSnippet: string): string {
        const regex = /^(?!\s*$)/gm;
        const indent = ' ';
        const count = 8;
        const indentedCodeSnippet = decodedSnippet.replace(regex, indent.repeat(count));
        return indentedCodeSnippet;
    }
}
