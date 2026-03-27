import {html, parse} from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import {ColorSchemeType} from "diff2html/lib/types"
import {styles} from "./diff-item.styles.ts"
import {formatDate} from "../../utils/date.ts"

type Props = {
    diffText: string;
    title: string;
    date: string;
    sourceUrl?: string;
    hasSiblings?: boolean;
    onKeepOnly?: () => void;
};

export function DiffItem({diffText, title, date, sourceUrl, hasSiblings, onKeepOnly}: Props) {
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
                {hasSiblings && (
                    <button onClick={onKeepOnly} style={styles.keepOnlyButton}>
                        keep only this
                    </button>
                )}
            </h3>
            {sourceUrl && (
                <div style={styles.sourceUrl}>
                    <a href={sourceUrl} target="_blank" rel="noreferrer" style={styles.sourceLink}>{sourceUrl}</a>
                </div>
            )}
            <div dangerouslySetInnerHTML={{__html: diffHtml}}/>
        </div>
    )
}