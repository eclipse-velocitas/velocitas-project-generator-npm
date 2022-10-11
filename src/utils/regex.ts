export const REGEX = {
    // Get everything between logger and class from template
    FROM_LOGGER_TO_CLASS: /(?<=\_\))[\r\n]+(^[\S\s*]*class)/gm,
    // Get """Sample Vehicle App""" from template
    GET_SAMPLE_VEHICLE_APP: /(^\"\"\").*[\r\n]+[\r\n]/gm,
    // Remove all lines with whitespaces followed by # (comments) from template
    GET_WHITESPACE_FOLLOWED_BY_COMMENTS: /^(?:[\t ]*(?:\r?|\r).\#.*\n?)+/gm,
    // Everything between multiline comment from template
    EVERYTHING_BETWEEN_MULTILINE: /(?=\"\"\")[\S\s]*(?<=[\s]\"\"\"$)[\S\s]/gm,
    // Every """ (docstring) from template
    GET_EVERY_PYTHON_DOCSTRING: /^(?:[\t ]*(?:\r?|\r).\"\"\".*\n?)+/gm,
    // Get everything between on_speed_change and "async def main():" from template
    GET_EVERY_DELETABLE_TEMPLATE_CODE: /(?<=\(self\.on\_speed\_change\))[\r\n]+(^[\S\s*]*async def main\(\)\:)/gm,
    // Replace content in on_start method (Here digital.auto code comes in)
    FIND_BEGIN_OF_ON_START_METHOD: /[\t ]*logger\.info\(\"SampleApp started\.\"\)[\r\n]+([^\r\n]+)/gm,
    FIND_VEHICLE_OCCURENCE: /vehicle/gm,
    FIND_UNWANTED_VEHICLE_CHANGE: /\(await self\.Vehicle/gm,
    FIND_PRINTF_STATEMENTS: /print\(f/gm,
    FIND_PRINT_STATEMENTS: /print\(/gm,
    FIND_EVERY_LINE_START: /^(?!\s*$)/gm,
    FIND_LINE_BEGINNING_WITH_WHITESPACES: /^\s+/gm,
};
