/* eslint-disable */
module.exports = {
    parserOptions: {
        "parser": "babel-eslint",
        "ecmaVersion": 2017,
        "sourceType": "module",
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
        }
    },
    extends: [
        'recommended/esnext',
        'recommended/esnext/style-guide',
        'plugin:vue/base'
    ],
    plugins: [
        'vue',
    ],
    rules: {
        'indent': 'off',
        'vue/html-indent': 'off',
        "import/no-unresolved": 'off',
        'babel/generator-star-spacing': 'off',
        'sort-imports': 'off',
        'import/no-namespace': 'off',
        'no-new': 'off',
        'no-console': 'off',
        'curly': 'off',
        'no-unused-vars': 'off',
        'import/prefer-default-export': 'off',
        'object-property-newline': 'off',
        'object-curly-newline': 'off',
        'arrow-body-style': 'off',
        'linebreak-style': 'off',
        'quote-props': 'off',
        'no-unused-expressions': 'off',
        'arrow-parens': 'off',
        'array-bracket-spacing': 'off',
    },
    globals: {
        "google": true,
        "gapi": true
    }
}
