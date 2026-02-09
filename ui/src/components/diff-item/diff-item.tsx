import {html, parse} from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import {ColorSchemeType} from "diff2html/lib/types"
import {styles} from "./diff-item.styles.ts"
import {formatDate} from "../../utils/date.ts"

type Props = {
    diffText: string;
    title: string;
    date: string;
};

export function DiffItem({diffText, title, date}: Props) {
    if (!diffText) return null

    const diffHtml = html(parse(diffText), {
        drawFileList: false,
        outputFormat: 'line-by-line',
        colorScheme: ColorSchemeType.DARK
    })

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>
                {title} <small style={styles.date}>{formatDate(date)}</small>
            </h3>
            <div dangerouslySetInnerHTML={{__html: diffHtml}}/>
        </div>
    )
}