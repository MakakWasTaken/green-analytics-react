/**
 * drawdown.js
 * (c) Adam Leggett
 */

// Typescript port of https://github.com/adamvleggett/drawdown
export const markdown = (src: string): string => {
  let tmpSrc = src

  const rx_lt = /</g
  const rx_gt = />/g
  const rx_space = /\t|\r|\uf8ff/g
  const rx_escape = /\\([\\\|`*_{}\[\]()#+\-~])/g
  const rx_hr = /^([*\-=_] *){3,}$/gm
  const rx_blockquote = /\n *> *(.*)(?=(\n|$){2})/g
  const rx_list =
    /\n( *)(?:[*\-+]|((\d+)|([a-z])|[A-Z])[.)]) +(.*)(?=(\n|$){2})/g
  const rx_listjoin = /<\/(ol|ul)>\n\n<\1>/g
  const rx_highlight =
    /(^|[^A-Za-z\d\\])(([*_])|(~)|(\^)|(--)|(\+\+)|`)(\2?)([^<]*)\2\8(?!\2)(?=\W|_|$)/g
  const rx_code = /\n((```|~~~).*\n?(.*)\n?\2|(( {4}.*\n)+))/g
  const rx_link = /((!?)\[(.*)\]\((.*)( ".*")?\)|\\([\\`*_{}\[\]()#+\-.!~]))/g
  const rx_table = /\n(( *\|.*\| *\n)+)/g
  const rx_thead = /^.*\n( *\|( *[\:\-]+ *\|)* *\n|)/
  const rx_row = /.*\n/g
  const rx_cell = /\||(.*[^\\])\|/g
  const rx_heading = /(?=^|>|\n)([>\s]*)(#{1,6}) (.*)( #*)? *(?=\n|$)/g
  const rx_para = /(?=^|>|\n)\s*\n+([^<]+?)\n+\s*(?=\n|<|$)/g
  const rx_stash = /-\d+\uf8ff/g

  const replace = (
    rex: RegExp,
    fn: string | ((substring: string, ...args: string[]) => string),
  ) => {
    // Typescript acting weird, when type is unsure.
    if (typeof fn === 'string') {
      tmpSrc = tmpSrc.replace(rex, fn)
    } else {
      tmpSrc = tmpSrc.replace(rex, fn)
    }
  }

  const element = (tag: string, content: string) => {
    return `<${tag}>${content}</${tag}>`
  }

  const blockquote = (src: string): string => {
    return src.replace(rx_blockquote, (all, content) =>
      element(
        'blockquote',
        blockquote(highlight(content.replace(/^ *&gt; */gm, ''))),
      ),
    )
  }

  const list = (src: string) => {
    return src.replace(rx_list, (all, ind, ol, num, low, content) => {
      const entry = element(
        'li',
        highlight(
          content
            .split(RegExp(`\n ?${ind}(?:(?:\\d+|[a-zA-Z])[.)]|[*\\-+]) +`, 'g'))
            .map(list)
            .join('</li><li>'),
        ),
      )

      return `\n${
        ol
          ? `<ol start="${
              num
                ? `${ol}">`
                : `${parseInt(ol, 36) - 9}" style="list-style-type:${
                    low ? 'low' : 'upp'
                  }er-alpha">`
            }${entry}</ol>`
          : element('ul', entry)
      }`
    })
  }

  const highlight = (src: string): string => {
    return src.replace(
      rx_highlight,
      (
        all,
        _,
        p1,
        emp,
        sub,
        sup,
        small,
        big,
        p2,
        content,
      ) => {
        return (
          _ +
          element(
            emp
              ? p2
                ? 'strong'
                : 'em'
              : sub
                ? p2
                  ? 's'
                  : 'sub'
                : sup
                  ? 'sup'
                  : small
                    ? 'small'
                    : big
                      ? 'big'
                      : 'code',
            highlight(content),
          )
        )
      },
    )
  }

  const unesc = (str: string) => {
    return str.replace(rx_escape, '$1')
  }

  const stash: string[] = []
  let si = 0

  tmpSrc = `\n${src}\n`

  replace(rx_lt, '&lt;')
  replace(rx_gt, '&gt;')
  replace(rx_space, '  ')

  // blockquote
  tmpSrc = blockquote(src)

  // horizontal rule
  replace(rx_hr, '<hr/>')

  // list
  tmpSrc = list(src)
  replace(rx_listjoin, '')

  // code
  replace(rx_code, (all, p1, p2, p3, p4) => {
    stash[--si] = element(
      'pre',
      element('code', p3 || p4.replace(/^ {4}/gm, '')),
    )
    return `${si}\uf8ff`
  })

  // link or image
  replace(
    rx_link,
    (
      all,
      p1: string,
      p2: string,
      p3: string,
      p4: string,
      p5: string,
      p6: string,
    ) => {
      stash[--si] = p6 ? p6 : p2
          ? p4
              ? `<img src="${p4}" alt="${p3}"/>`
              : p1
          : `<a href="${p4}">${unesc(highlight(p3))}</a>`;
      return `${si}\uf8ff`;
    },
  )

  // table
  replace(rx_table, (all, table) => {
    const sep = table.match(rx_thead)?.[1]
    return `\n${element(
      'table',
      table.replace(rx_row, (row, ri) => {
        return row === sep
          ? ''
          : element(
              'tr',
              row.replace(rx_cell, (all, cell, ci) => {
                return ci
                  ? element(
                      sep && !ri ? 'th' : 'td',
                      unesc(highlight(cell || '')),
                    )
                  : ''
              }),
            )
      }),
    )}`
  })

  // heading
  replace(
    rx_heading,
    (all, _, p1, p2) => _ + element(`h${p1.length}`, unesc(highlight(p2))),
  )

  // paragraph
  replace(rx_para, (all, content) => element('p', unesc(highlight(content))))

  // stash
  replace(rx_stash, (all) => stash[parseInt(all)])

  return src.trim()
}

export default markdown
