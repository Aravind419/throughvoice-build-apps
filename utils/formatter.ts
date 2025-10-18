import prettier from 'prettier/standalone';
import * as prettierPluginHtml from 'prettier/plugins/html';
import * as prettierPluginBabel from 'prettier/plugins/babel';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as prettierPluginPostcss from 'prettier/plugins/postcss';

const getParser = (fileName: string) => {
  if (fileName.endsWith('.html')) return 'html';
  if (fileName.endsWith('.css')) return 'css';
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'babel';
  return null;
};

export const formatCode = async (fileName: string, content: string): Promise<string> => {
  const parser = getParser(fileName);
  if (!parser) {
    return content; // Return original content if no parser is found
  }

  try {
    const formattedContent = await prettier.format(content, {
      parser: parser,
      plugins: [prettierPluginHtml, prettierPluginBabel, prettierPluginEstree, prettierPluginPostcss],
      // Prettier options can be added here
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
    });
    return formattedContent;
  } catch (error) {
    console.warn(`Could not format ${fileName}:`, error);
    return content; // Return original content on formatting error
  }
};
