from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"D:\glarivo")
OUTPUT = ROOT / "output" / "pdf" / "Glarivo_Shot_Glass_Sizes_Wholesale_Buyers_Guide_CN.pdf"
LOGO = ROOT / "public" / "brand" / "glarivo-logo-blue.png"

FONT_REGULAR = r"C:\Windows\Fonts\msyh.ttc"
FONT_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"

pdfmetrics.registerFont(TTFont("YaHei", FONT_REGULAR, subfontIndex=0))
pdfmetrics.registerFont(TTFont("YaHei-Bold", FONT_BOLD, subfontIndex=0))

NAVY = colors.HexColor("#102A59")
BLUE = colors.HexColor("#075989")
SKY = colors.HexColor("#EAF5FB")
LIME = colors.HexColor("#C7F000")
INK = colors.HexColor("#1B2430")
MUTED = colors.HexColor("#5B6878")
LINE = colors.HexColor("#D9E2EC")
PALE = colors.HexColor("#F5F8FB")
WHITE = colors.white


base = getSampleStyleSheet()
styles = {
    "cover_title": ParagraphStyle(
        "cover_title",
        fontName="YaHei-Bold",
        fontSize=28,
        leading=39,
        textColor=WHITE,
        alignment=TA_LEFT,
        spaceAfter=7 * mm,
    ),
    "cover_subtitle": ParagraphStyle(
        "cover_subtitle",
        fontName="YaHei",
        fontSize=13,
        leading=21,
        textColor=colors.HexColor("#DCE9F7"),
        alignment=TA_LEFT,
        spaceAfter=13 * mm,
    ),
    "cover_meta": ParagraphStyle(
        "cover_meta",
        fontName="YaHei",
        fontSize=9.5,
        leading=16,
        textColor=colors.HexColor("#DCE9F7"),
    ),
    "h1": ParagraphStyle(
        "h1",
        fontName="YaHei-Bold",
        fontSize=22,
        leading=31,
        textColor=NAVY,
        spaceBefore=1 * mm,
        spaceAfter=6 * mm,
    ),
    "h2": ParagraphStyle(
        "h2",
        fontName="YaHei-Bold",
        fontSize=15.5,
        leading=23,
        textColor=NAVY,
        spaceBefore=4 * mm,
        spaceAfter=3.2 * mm,
        keepWithNext=True,
    ),
    "h3": ParagraphStyle(
        "h3",
        fontName="YaHei-Bold",
        fontSize=11.5,
        leading=18,
        textColor=BLUE,
        spaceBefore=3.2 * mm,
        spaceAfter=1.5 * mm,
        keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "body",
        fontName="YaHei",
        fontSize=9.4,
        leading=16.5,
        textColor=INK,
        spaceAfter=2.6 * mm,
        wordWrap="CJK",
    ),
    "body_bold": ParagraphStyle(
        "body_bold",
        fontName="YaHei-Bold",
        fontSize=9.4,
        leading=16.5,
        textColor=INK,
        spaceAfter=2.6 * mm,
        wordWrap="CJK",
    ),
    "bullet": ParagraphStyle(
        "bullet",
        fontName="YaHei",
        fontSize=9.2,
        leading=15.8,
        leftIndent=5 * mm,
        firstLineIndent=-3.5 * mm,
        textColor=INK,
        spaceAfter=1.6 * mm,
        wordWrap="CJK",
    ),
    "callout": ParagraphStyle(
        "callout",
        fontName="YaHei",
        fontSize=9.5,
        leading=17,
        textColor=NAVY,
        leftIndent=4 * mm,
        rightIndent=4 * mm,
        spaceBefore=2 * mm,
        spaceAfter=2 * mm,
        wordWrap="CJK",
    ),
    "caption": ParagraphStyle(
        "caption",
        fontName="YaHei",
        fontSize=7.8,
        leading=12,
        textColor=MUTED,
        spaceAfter=2 * mm,
        wordWrap="CJK",
    ),
    "toc": ParagraphStyle(
        "toc",
        fontName="YaHei",
        fontSize=10.2,
        leading=18,
        textColor=INK,
        leftIndent=2 * mm,
        spaceAfter=1.4 * mm,
    ),
    "table": ParagraphStyle(
        "table",
        fontName="YaHei",
        fontSize=8.0,
        leading=12.3,
        textColor=INK,
        wordWrap="CJK",
    ),
    "table_head": ParagraphStyle(
        "table_head",
        fontName="YaHei-Bold",
        fontSize=8.1,
        leading=12.5,
        textColor=WHITE,
        wordWrap="CJK",
    ),
    "source": ParagraphStyle(
        "source",
        fontName="YaHei",
        fontSize=8.0,
        leading=13.5,
        textColor=INK,
        leftIndent=5 * mm,
        firstLineIndent=-5 * mm,
        spaceAfter=2.5 * mm,
        wordWrap="CJK",
    ),
}


def para(text, style="body"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph(f"- {text}", styles["bullet"])


def callout(title, text):
    content = Paragraph(f"<b>{title}</b><br/>{text}", styles["callout"])
    box = Table([[content]], colWidths=[171 * mm])
    box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SKY),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#A9D5EA")),
                ("LINEBEFORE", (0, 0), (0, -1), 4, BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    return box


def data_table(rows, widths, font_size=8.0):
    converted = []
    for row_index, row in enumerate(rows):
        style = styles["table_head"] if row_index == 0 else ParagraphStyle(
            f"table_{font_size}_{row_index}",
            parent=styles["table"],
            fontSize=font_size,
            leading=font_size * 1.53,
        )
        converted.append([Paragraph(str(cell), style) for cell in row])
    table = Table(converted, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "YaHei-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.45, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2.3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.0 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.0 * mm),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
            ]
        )
    )
    return table


def section_title(number, title):
    return [
        Paragraph(f"{number}  {title}", styles["h2"]),
        HRFlowable(width="100%", thickness=0.7, color=LINE, spaceAfter=3 * mm),
    ]


def first_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.circle(width + 8 * mm, height - 28 * mm, 50 * mm, fill=1, stroke=0)
    canvas.setFillColor(LIME)
    canvas.rect(18 * mm, 39 * mm, 42 * mm, 2.4 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#173B78"))
    canvas.roundRect(18 * mm, height - 47 * mm, 66 * mm, 20 * mm, 3 * mm, fill=1, stroke=0)
    if LOGO.exists():
        canvas.setFillColor(WHITE)
        canvas.roundRect(22 * mm, height - 43 * mm, 58 * mm, 12 * mm, 2 * mm, fill=1, stroke=0)
        canvas.drawImage(str(LOGO), 25 * mm, height - 40.7 * mm, width=52 * mm, height=7.5 * mm, preserveAspectRatio=True, mask="auto")
    canvas.restoreState()


def later_pages(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, height - 14.5 * mm, width - 18 * mm, height - 14.5 * mm)
    canvas.setFont("YaHei-Bold", 7.8)
    canvas.setFillColor(NAVY)
    canvas.drawString(18 * mm, height - 10.5 * mm, "GLARIVO | 烈酒杯采购指南")
    canvas.setFont("YaHei", 7.8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 18 * mm, 10.5 * mm, f"第 {doc.page} 页")
    canvas.setFillColor(LIME)
    canvas.rect(18 * mm, 8.5 * mm, 17 * mm, 1.2 * mm, fill=1, stroke=0)
    canvas.restoreState()


story = []

# Cover
story.extend(
    [
        Spacer(1, 62 * mm),
        Paragraph("Shot Glass（烈酒杯）<br/>容量与批发采购指南", styles["cover_title"]),
        Paragraph("25-90 ml 容量选择、定制、包装、询价与样品验收", styles["cover_subtitle"]),
        HRFlowable(width=42 * mm, thickness=2.2, color=LIME, hAlign="LEFT", spaceAfter=10 * mm),
        Paragraph("为酒吧、餐饮、礼赠、零售与品牌项目采购人员编写", styles["cover_meta"]),
        Spacer(1, 2 * mm),
        Paragraph("Glarivo B2B 玻璃器皿采购指南 | 2026 年 9 月", styles["cover_meta"]),
        Spacer(1, 51 * mm),
        Paragraph("本指南中的容量区间用于选型与沟通，不代替样品确认、合同规格或当地计量法规。", styles["cover_meta"]),
        PageBreak(),
    ]
)

# Contents and executive summary
story.append(Paragraph("目录与采购结论", styles["h1"]))
toc_items = [
    "01  先给答案：烈酒杯没有全球统一容量",
    "02  容量换算：ml、fl oz 与常见标注",
    "03  三种容量必须分清：标称、满杯、可用",
    "04  常见容量区间及其适用场景",
    "05  容量之外：尺寸、底厚、杯口与造型",
    "06  材质与成型工艺如何影响采购",
    "07  定制方式与文件准备",
    "08  包装、装箱与运输风险",
    "09  一份不容易返工的询价单",
    "10  样品审批与量产验收",
    "11  按应用场景选择容量",
    "12  常见问题 FAQ",
    "13  参考来源与重要说明",
]
for item in toc_items:
    story.append(Paragraph(item, styles["toc"]))
story.append(Spacer(1, 4 * mm))
story.append(
    callout(
        "采购结论",
        "不要只问“杯子是多少毫升”。一份可执行的规格至少应同时写明容量口径、杯高、杯口外径、底部外径、单杯重量或重量公差、材质/成型方式、装饰工艺、包装方式，以及样品批准标准。",
    )
)
story.append(Spacer(1, 3 * mm))
story.append(para("最值得先记住的四点：", "body_bold"))
story.extend(
    [
        bullet("“1 shot”不是全球统一的杯体容量。不同市场、酒类服务习惯和应用场景会采用不同量值。"),
        bullet("1 美制液体盎司约等于 29.57 ml；1.5 美制液体盎司约等于 44.36 ml。"),
        bullet("25 ml、30 ml、35 ml、45 ml、50 ml、60 ml 都可能是合理的采购规格，关键是与使用目的和市场要求匹配。"),
        bullet("最终决定应以批准样品和书面规格为准，不应只依赖商品标题、效果图或行业俗称。"),
        PageBreak(),
    ]
)

# Section 1
story.extend(section_title("01", "先给答案：烈酒杯没有全球统一容量"))
story.append(
    para(
        "采购人员经常把“shot glass”理解为某一个固定容量，但在国际贸易中，这个词更接近一种产品类别。它通常指用于烈酒、小份饮品、品鉴或仪式性饮用的小容量杯具，而不是一个统一的计量单位。"
    )
)
story.append(para("造成差异的主要原因包括："))
story.extend(
    [
        bullet("市场习惯不同：北美常见以美制液体盎司标注，欧洲和多数出口单据更常用 ml。"),
        bullet("服务目的不同：单份烈酒、双份、品鉴、鸡尾酒分装、甜品杯或礼赠杯，需要的容量并不相同。"),
        bullet("法规语境不同：法律规定的可能是酒吧“按杯销售时的计量份量”，并不等同于玻璃杯的满杯容量。"),
        bullet("制造口径不同：供应商可能报告标称容量、满杯容量或建议使用容量，如果不注明口径，同一个数字可能代表不同含义。"),
    ]
)
story.append(
    callout(
        "避免误解",
        "英国政府对杜松子酒、朗姆酒、伏特加和威士忌按杯销售的指定量为 25 ml 或 35 ml，以及其倍数；同一场所应采用其中一种。这个规定描述的是零售计量方式，不能直接推导出采购杯体必须是 25 ml 或 35 ml。",
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("采购时应该怎样问", styles["h3"]))
story.append(
    para(
        "把“你们有标准 shot glass 吗？”改成更具体的问题：需要标称容量还是满杯容量？目标倒酒线是多少？是否需要 25 ml / 35 ml 量线？杯子用于单份酒、双份酒、品鉴还是礼赠？是否有目标杯高、杯口直径和单杯重量？"
    )
)
story.append(Paragraph("什么时候容量数字仍然不够", styles["h3"]))
story.append(
    para(
        "即使双方都确认了 50 ml，外观和使用感仍可能完全不同。一只窄高杯和一只矮宽杯可以拥有相同容量，但重心、堆叠、饮用口感、印刷面积和包装效率会明显不同。因此，容量应当与二维尺寸图、重量数据和实物样品一起确认。"
    )
)
story.append(PageBreak())

# Section 2
story.extend(section_title("02", "容量换算：ml、fl oz 与常见标注"))
story.append(
    para(
        "跨境询价中最常见的换算是毫升与美制液体盎司。美国国家标准与技术研究院（NIST）的近似换算表给出：1 美制液体盎司约等于 29.57 ml。实际商品标注通常会四舍五入，因此 1.5 fl oz 可能被写作 44 ml、45 ml 或 1.5 oz。"
    )
)
story.append(
    data_table(
        [
            ["美制液体盎司", "精确换算值（约）", "采购中常见写法", "备注"],
            ["0.5 fl oz", "14.79 ml", "15 ml", "小份品鉴或量杯用途"],
            ["1.0 fl oz", "29.57 ml", "30 ml", "常见小容量区间"],
            ["1.25 fl oz", "36.97 ml", "35 ml 或 37 ml", "不可只凭名称推定"],
            ["1.5 fl oz", "44.36 ml", "44 ml 或 45 ml", "美国烈酒服务参考值之一"],
            ["2.0 fl oz", "59.15 ml", "60 ml", "常见大容量或双份区间"],
            ["3.0 fl oz", "88.72 ml", "90 ml", "大容量、甜品或创意饮品"],
        ],
        [31 * mm, 40 * mm, 45 * mm, 55 * mm],
    )
)
story.append(Spacer(1, 2 * mm))
story.append(para("推荐在询价单和合同中优先使用 ml，并把 fl oz 作为辅助参考。例如："))
story.append(
    callout(
        "推荐写法示例",
        "标称容量：45 ml（约 1.5 US fl oz）；满杯容量：由供应商在技术图纸中确认；目标倒酒线：30 ml；允许偏差：由双方在样品阶段书面确认。",
    )
)
story.append(Paragraph("为什么不能只写“oz”", styles["h3"]))
story.append(
    para(
        "“oz”可能被误解为重量盎司，也可能没有说明是美制液体盎司还是英制液体盎司。玻璃杯容量应写成 US fl oz 或直接写 ml；单杯重量则使用 g。这样可以避免容量与重量混淆。"
    )
)
story.append(Paragraph("1.5 fl oz 的正确理解", styles["h3"]))
story.append(
    para(
        "美国酒类烟草税收和贸易局（TTB）的 Alcohol Facts 指引在烈酒份量示例中使用 1.5 fl oz（44 ml）。这是标签和消费者信息语境中的参考份量，并不意味着所有美国 shot glass 的杯体容量都必须是 1.5 fl oz。"
    )
)
story.append(PageBreak())

# Section 3
story.extend(section_title("03", "三种容量必须分清：标称、满杯、可用"))
story.append(
    data_table(
        [
            ["容量术语", "含义", "采购风险", "建议写法"],
            ["标称容量 Nominal Capacity", "产品目录或型号中用于识别的容量值", "不一定等于实际装满后的测量值", "写明该值仅作型号识别，还是合同验收值"],
            ["满杯容量 Brimful Capacity", "液体加到杯口、接近溢出时的最大容量", "不适合日常饮用，也不等于服务份量", "规定测量温度、液体和测量方法"],
            ["可用容量 Usable Capacity", "留出合理杯口空间后的建议实际装量", "“合理空间”如果不量化，会产生争议", "用 ml 或距杯口多少 mm 明确表示"],
            ["量线容量 Fill-line Capacity", "液面达到印刷线或模具刻度时的容量", "线宽、位置和视差会影响判读", "写明目标值、位置公差及验证方法"],
        ],
        [35 * mm, 48 * mm, 45 * mm, 43 * mm],
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("建议测量方法", styles["h3"]))
story.extend(
    [
        bullet("使用校准过或至少可追溯的量具，记录量具精度。"),
        bullet("样品放置在水平桌面，使用常温清水，避免泡沫影响读数。"),
        bullet("对满杯容量，统一规定液面位置，例如液体表面与杯口最高点齐平。"),
        bullet("对可用容量，直接规定目标液面距杯口的垂直距离，而不是只写“留一点空间”。"),
        bullet("抽测多只样品并记录最小值、最大值和平均值；抽样数量由双方根据订单和风险确定。"),
    ]
)
story.append(
    callout(
        "合同边界",
        "玻璃制品会存在工艺波动。指南不替代具体公差协议。容量、尺寸、重量、颜色和装饰位置的允许偏差，应在批准样品后写入采购合同或质量协议。",
    )
)
story.append(Spacer(1, 4 * mm))
story.append(Paragraph("一个常见错误", styles["h3"]))
story.append(
    para(
        "买方要求“50 ml 杯”，供应商提供满杯 50 ml 的样品，而最终使用场景希望实际装 50 ml 且仍保留杯口空间。两种理解都可能合理，却会导致完全不同的杯型。解决方法是同时给出目标倒酒量与所需杯口余量。"
    )
)
story.append(PageBreak())

# Section 4
story.extend(section_title("04", "常见容量区间及其适用场景"))
story.append(
    para(
        "下面的区间是采购沟通工具，不是全球统一标准。实际选择需要结合当地服务习惯、目标饮品、杯型、装饰和包装。"
    )
)
story.append(
    data_table(
        [
            ["容量区间", "典型用途", "优点", "采购时重点确认"],
            ["10-25 ml", "小份品鉴、烈酒计量、试饮套装", "轻巧、单位包装体积小", "是否需要量线；杯口是否过窄；清洗便利性"],
            ["30-35 ml", "单份烈酒、酒吧服务、活动试饮", "接近部分市场常用服务份量", "法规适用性；实际倒酒量与满杯容量"],
            ["40-50 ml", "通用单份、小型鸡尾酒、零售礼盒", "应用范围广，装饰面积相对充足", "45 ml 与 50 ml 的容量口径；杯身印刷区域"],
            ["55-60 ml", "双份、小型调饮、品牌礼赠", "视觉存在感更强，使用弹性大", "重心、杯壁厚度、外箱重量"],
            ["65-75 ml", "创意饮品、层次酒、餐饮配杯", "更大的饮用与装饰空间", "是否仍符合目标品类定位；包装分隔"],
            ["90-120 ml", "甜品、酱汁、迷你饮品、礼赠套装", "跨场景用途多", "不要仅按 shot glass 关键词采购；确认杯口与勺具适配"],
        ],
        [27 * mm, 46 * mm, 44 * mm, 54 * mm],
        font_size=7.7,
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("容量选择的实用逻辑", styles["h3"]))
story.extend(
    [
        bullet("如果目标是严格控制倒酒份量：先确定服务量，再确定量线和杯口余量。"),
        bullet("如果目标是品牌展示：先确认 logo 的最小可印刷尺寸，再选择具有足够平直区域的杯型。"),
        bullet("如果目标是零售礼盒：先确定礼盒尺寸、杯数和展示方向，再反推杯体外径与高度。"),
        bullet("如果目标是餐饮高频使用：关注握持、重心、杯口触感、清洗方式和替换便利性。"),
        bullet("如果目标是电商销售：除容量外，还要准备可验证的尺寸、净重、包装尺寸和使用场景说明。"),
    ]
)
story.append(PageBreak())

# Section 5
story.extend(section_title("05", "容量之外：尺寸、底厚、杯口与造型"))
story.append(Paragraph("杯高与杯口外径", styles["h3"]))
story.append(
    para(
        "杯高影响握持、展示、洗杯篮适配和内包装高度；杯口外径影响饮用感、托盘密度和印刷曲率。两只容量相同的杯子，杯口直径可能差异很大。询价时应提供毫米尺寸，并要求供应商回传技术图。"
    )
)
story.append(Paragraph("底部外径与底厚", styles["h3"]))
story.append(
    para(
        "较宽或较厚的杯底通常会带来更稳重的视觉和手感，但也可能增加单杯重量、纸箱毛重与运输成本。底厚还会改变内部容积，因此不能从外观照片推断容量。"
    )
)
story.append(Paragraph("单杯重量", styles["h3"]))
story.append(
    para(
        "单杯重量是连接产品体验和物流成本的重要参数。确认时应区分目标重量、平均重量和允许偏差，并说明称重是否包含装饰。不要把“重底”理解为固定克重；它只是一种相对描述。"
    )
)
story.append(Paragraph("杯口与饮用触感", styles["h3"]))
story.append(
    para(
        "杯口厚度、圆润度和一致性会影响饮用感与视觉品质。若项目重视高端体验，应在样品审批表中单独设置杯口检查项，而不是只看容量和 logo。"
    )
)
story.append(Paragraph("常见造型对比", styles["h3"]))
story.append(
    data_table(
        [
            ["造型", "特征", "可能适合", "需要留意"],
            ["直筒型", "杯壁接近垂直，规格清晰", "通用酒吧、量线、简洁品牌", "堆叠性不能仅凭外观看，需要实测"],
            ["锥形", "上宽下窄或轻微外扩", "快速拿取、视觉轻巧", "弧面印刷变形、重心与底径"],
            ["重底型", "底部玻璃较厚，视觉稳定", "礼赠、品牌展示、烈酒服务", "重量、装箱毛重、内部容积"],
            ["高脚/杯脚型", "杯体与底座分离感明显", "品鉴、餐饮展示", "装箱防护、杯脚一致性、运输破损"],
            ["方形或异形", "具有辨识度和展示价值", "品牌项目、特色零售", "模具、角位应力、印刷定位和包装"],
        ],
        [30 * mm, 43 * mm, 45 * mm, 53 * mm],
        font_size=7.6,
    )
)
story.append(PageBreak())

# Section 6
story.extend(section_title("06", "材质与成型工艺如何影响采购"))
story.append(Paragraph("常见玻璃材质", styles["h3"]))
story.append(
    para(
        "日用小酒杯常见钠钙玻璃，但具体配方、颜色、透明度和性能应由供应商根据产品提供资料。不要仅凭“玻璃”“水晶感”或照片推断材质。若项目对成分、食品接触、洗碗机使用或耐热有要求，应提出目标市场和测试要求，并索取对应产品或批次的证据。"
    )
)
story.append(Paragraph("机器压制", styles["h3"]))
story.append(
    para(
        "机器压制适合形成较厚的杯壁、底部或纹理，外观稳重，通常便于大批量一致生产。采购时需要检查合模线、底部平整度、纹理清晰度和杯口处理。"
    )
)
story.append(Paragraph("机器吹制", styles["h3"]))
story.append(
    para(
        "机器吹制可获得不同的杯身比例和相对轻盈的视觉。应关注杯壁分布、杯口一致性、容量波动和外观变形。具体特性依产品、模具和工艺而异，不能只从工艺名称判断优劣。"
    )
)
story.append(Paragraph("手工制作或半手工工艺", styles["h3"]))
story.append(
    para(
        "手工特征可以带来独特外观，但尺寸、重量和气泡等外观差异的接受范围必须提前定义。若营销中要使用“手工”“手吹”等表述，应由供应商提供可核实的生产信息。"
    )
)
story.append(
    callout(
        "证据原则",
        "材料名称不是产品性能或认证的证据。任何关于耐热、抗冲击、可机洗、无铅、食品接触或特定法规符合性的声明，都应对应到具体型号、测试方法、报告版本和适用市场。",
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("外观质量可讨论的检查项", styles["h3"]))
story.extend(
    [
        bullet("明显气泡、结石、裂纹、缺口、锐边和脏污。"),
        bullet("杯口圆度、杯身垂直度、底部平整度与晃动。"),
        bullet("透明度、色差、模具线和表面波纹的接受标准。"),
        bullet("装饰前后单杯重量、容量和尺寸是否仍在约定范围内。"),
    ]
)
story.append(PageBreak())

# Section 7
story.extend(section_title("07", "定制方式与文件准备"))
story.append(
    data_table(
        [
            ["定制方式", "适合表现", "样品阶段重点", "采购文件应说明"],
            ["丝网印刷", "单色或少色 logo、文字、量线", "颜色、套印、边缘、位置、附着表现", "专色号、印刷尺寸、距杯口/底部距离"],
            ["贴花", "多色图案、环绕设计、复杂细节", "接缝、气泡、图案变形、烧花后色差", "展开图、接缝位置、颜色参考、禁印区"],
            ["喷色/喷涂", "整杯或渐变色外观", "均匀度、遮盖、边界、手感", "目标颜色、透明/不透明、覆盖范围"],
            ["激光雕刻/蚀刻效果", "永久感、低调 logo、礼赠", "深浅、边缘、可读性、位置", "矢量文件、最小线宽、尺寸和方向"],
            ["金属色装饰", "金边、金色图案、高识别礼盒", "色泽、连续性、使用限制", "颜色样、覆盖范围及维护说明"],
        ],
        [29 * mm, 43 * mm, 50 * mm, 49 * mm],
        font_size=7.45,
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("买方最好准备的设计资料", styles["h3"]))
story.extend(
    [
        bullet("矢量 logo：AI、EPS、SVG 或可编辑 PDF；同时提供字体转曲版本。"),
        bullet("颜色：Pantone 或双方认可的实体颜色样，不要只用屏幕截图。"),
        bullet("尺寸：印刷宽高、旋转角度、正视方向、距杯口和杯底的距离。"),
        bullet("安全区：明确图案不得进入的杯口接触区、底部或高曲率区域。"),
        bullet("版本号：每一版图稿、样品和确认邮件使用一致的版本编号。"),
    ]
)
story.append(Paragraph("装饰与使用声明", styles["h3"]))
story.append(
    para(
        "装饰会改变产品的清洗、耐磨和使用限制。若要声明可机洗、适合长期商用或满足某项迁移要求，应针对最终装饰后的成品确认，而不是沿用空白玻璃杯的数据。"
    )
)
story.append(
    callout(
        "样品批准不是只看 logo",
        "批准定制样品时，应同时签认杯型、容量口径、尺寸、重量、玻璃颜色、装饰颜色、图案位置、包装方式和标签信息。只批准电子效果图，无法覆盖实物偏差。",
    )
)
story.append(PageBreak())

# Section 8
story.extend(section_title("08", "包装、装箱与运输风险"))
story.append(Paragraph("包装设计从运输链开始", styles["h3"]))
story.append(
    para(
        "玻璃杯包装不只是选择彩盒或牛皮箱。买方应先说明运输方式、装卸次数、托盘要求、零售展示方式和最终配送场景，再由供应商提出内隔、缓冲和外箱方案。"
    )
)
story.append(
    data_table(
        [
            ["层级", "需要确认的内容", "为什么重要"],
            ["单杯保护", "纸隔、蜂窝、泡棉、纸托或其他固定方式", "防止杯与杯、杯与盒之间直接碰撞"],
            ["内盒/彩盒", "每盒数量、摆放方向、开窗、印刷和条码位置", "影响零售展示、拣货和礼赠体验"],
            ["外箱", "每箱数量、内外箱尺寸、净重、毛重、箱唛", "影响运费、人工搬运、仓储和报关资料"],
            ["托盘", "托盘尺寸、堆码方式、护角、缠膜和限高", "影响装柜稳定性与目的仓接收"],
            ["运输验证", "跌落、振动或其他双方约定的方法", "让包装性能有可重复的判断依据"],
        ],
        [28 * mm, 76 * mm, 67 * mm],
        font_size=7.8,
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("装箱数量不是越多越好", styles["h3"]))
story.append(
    para(
        "提高每箱数量可以减少箱数，但也会增加单箱毛重并可能提高搬运和破损风险。应同时比较每箱数量、单箱重量、箱体强度、人工搬运限制和托盘利用率。"
    )
)
story.append(Paragraph("运输前应锁定的数据", styles["h3"]))
story.extend(
    [
        bullet("每只净重、每盒数量、每箱数量。"),
        bullet("内盒和外箱外尺寸，单位统一为 cm 或 mm。"),
        bullet("单箱净重、毛重、总体积和总箱数。"),
        bullet("箱唛、条码、原产地标识和客户标签的最终版本。"),
        bullet("破损处理方式、备用比例或补货责任，以订单条款为准。"),
    ]
)
story.append(PageBreak())

# Section 9
story.extend(section_title("09", "一份不容易返工的询价单"))
story.append(para("把下面内容复制到 RFQ（询价单）中，并删除不适用项："))
story.append(
    data_table(
        [
            ["模块", "应提供或要求确认的信息"],
            ["项目与用途", "目标市场、客户类型、使用场景、预计上市时间、是否零售或商用"],
            ["杯体规格", "标称容量、满杯容量、目标使用容量、杯高、杯口外径、底部外径、目标重量"],
            ["外观与工艺", "材质/配方信息、成型方式、透明/颜色要求、杯型参考图、可接受外观标准"],
            ["定制", "工艺、颜色、尺寸、位置、图稿版本、打样方式、是否需要量线"],
            ["包装", "每盒/每箱数量、内隔、彩盒、标签、箱唛、条码、托盘要求"],
            ["商务", "询价数量、目标贸易条款、目的港/收货地、报价有效期、付款节点"],
            ["质量与文件", "样品数量、检验项目、允许偏差、目标市场文件、报告应对应的型号和版本"],
            ["交期", "打样周期、样品批准后生产周期、包装确认截止日、预计出运时间"],
        ],
        [36 * mm, 135 * mm],
        font_size=8.0,
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("可直接使用的 RFQ 描述范例", styles["h3"]))
story.append(
    callout(
        "范例",
        "请报价一款透明玻璃烈酒杯，用于品牌礼赠。目标标称容量 60 ml；请在技术图中分别注明满杯容量和建议使用容量。请提供杯高、杯口外径、底部外径、单杯重量及各项公差。定制为单色 logo，图稿另附；请说明适合的工艺、最大印刷区和样品费用。包装为每套 4 只彩盒，需提供内隔方案、外箱尺寸、每箱数量、净重和毛重。最终规格与交期以批准样品和书面订单为准。",
    )
)
story.append(Spacer(1, 4 * mm))
story.append(Paragraph("询价时不要默认的内容", styles["h3"]))
story.extend(
    [
        bullet("不要默认目录容量就是满杯容量。"),
        bullet("不要默认现有模具可满足任意 logo 尺寸。"),
        bullet("不要默认空白杯与装饰成品具有相同使用限制。"),
        bullet("不要默认所有颜色、包装和订单数量都采用相同价格或交期。"),
        bullet("不要在没有证据时写入认证编号、合规结论或性能保证。"),
    ]
)
story.append(PageBreak())

# Section 10
story.extend(section_title("10", "样品审批与量产验收"))
story.append(Paragraph("样品审批清单", styles["h3"]))
story.append(
    data_table(
        [
            ["检查项目", "建议记录", "通过标准来源"],
            ["容量", "标称、满杯、目标量线的实测结果", "已确认规格/图纸"],
            ["尺寸", "杯高、杯口外径、底部外径", "技术图及允许偏差"],
            ["重量", "单只重量与样本分布", "批准样品/质量协议"],
            ["外观", "气泡、杂质、模具线、圆度、平稳度", "双方批准的限度样"],
            ["装饰", "颜色、尺寸、位置、可读性、边缘和附着", "签字图稿与装饰样"],
            ["包装", "摆放、内隔、标签、箱唛、装箱数量", "包装样/包装规范"],
            ["使用验证", "清洗、运输或项目特别测试的结果", "双方约定的方法与条件"],
        ],
        [35 * mm, 77 * mm, 59 * mm],
        font_size=7.8,
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("如何建立可追溯的批准样", styles["h3"]))
story.extend(
    [
        bullet("给样品分配唯一编号，并记录收到日期。"),
        bullet("拍摄正面、侧面、杯口、杯底、logo 和包装照片。"),
        bullet("把测量记录、图稿版本和供应商确认邮件归档到同一项目。"),
        bullet("买卖双方各保留一套签字或封样样品，保存条件尽量一致。"),
        bullet("任何改版都生成新版本，旧版本不应在没有说明的情况下被覆盖。"),
    ]
)
story.append(Paragraph("量产前与出货前", styles["h3"]))
story.append(
    para(
        "量产前应确认最终图稿、包装版面、条码、箱唛和生产规格。出货前的检验方案应基于订单风险、产品特征和双方协议，明确抽样、判定规则与缺陷分类。对于定制成品，检验不应只看空白杯。"
    )
)
story.append(
    callout(
        "关键原则",
        "“看起来差不多”不是验收标准。可接受与不可接受的边界，需要通过数值、公差、图片、限度样或约定测试方法表达。",
    )
)
story.append(PageBreak())

# Section 11
story.extend(section_title("11", "按应用场景选择容量"))
story.append(Paragraph("酒吧与餐饮", styles["h3"]))
story.append(
    para(
        "从实际服务份量出发，确认是否需要量线，再评估杯口余量、托盘稳定性、清洗设备和高频补货。若在受计量法规约束的市场使用，应由当地专业人员确认适用规则。"
    )
)
story.append(Paragraph("品牌礼赠", styles["h3"]))
story.append(
    para(
        "把 logo 可视性、手感、礼盒比例和开箱体验放在同一张规格表中。常见做法是选择具有明显底部重量感或较大平直印刷区的杯型，但最终仍要用实样判断。"
    )
)
story.append(Paragraph("零售套装", styles["h3"]))
story.append(
    para(
        "先定义套装杯数、货架尺寸、条码和消费者信息，再决定杯体。零售页面应准确区分单杯容量、套装总数量、产品净重与包装毛重，避免把杯体容量当成包装容量。"
    )
)
story.append(Paragraph("试饮与活动", styles["h3"]))
story.append(
    para(
        "关注快速分发、倒酒一致性、回收或清洗动线，以及活动现场的破损控制。小容量并不自动等于更合适；过小杯口可能影响倒酒和饮用。"
    )
)
story.append(Paragraph("甜品、酱汁与创意饮品", styles["h3"]))
story.append(
    para(
        "如果用途并非烈酒，选型时应关注勺具适配、杯口宽度、产品展示和清洗。90-120 ml 的产品虽然可能被供应商归入 shot glass 类目，但更应按实际功能评估。"
    )
)
story.append(Spacer(1, 2 * mm))
story.append(
    data_table(
        [
            ["采购优先级", "容量优先", "造型优先", "包装优先", "装饰优先"],
            ["酒吧份量控制", "高", "中", "中", "低到中"],
            ["品牌礼赠", "中", "高", "高", "高"],
            ["零售套装", "中", "中到高", "高", "中到高"],
            ["活动试饮", "高", "中", "高", "中"],
            ["甜品/创意用途", "中", "高", "中", "中"],
        ],
        [45 * mm, 31.5 * mm, 31.5 * mm, 31.5 * mm, 31.5 * mm],
        font_size=7.7,
    )
)
story.append(PageBreak())

# Section 12 FAQs
story.extend(section_title("12", "常见问题 FAQ"))
faqs = [
    ("1. 标准 shot glass 到底是多少毫升？", "没有全球统一答案。常见产品可能落在 25-60 ml 甚至更大范围。应按目标市场、实际倒酒量和杯体容量口径确认。"),
    ("2. 1 oz 是多少毫升？", "1 美制液体盎司约等于 29.57 ml，商品通常标作 30 ml。询价时请写 US fl oz 或 ml，避免只写 oz。"),
    ("3. 1.5 oz 是不是美国的唯一标准？", "1.5 美制液体盎司约等于 44.36 ml，TTB 在烈酒 Alcohol Facts 份量示例中使用 1.5 fl oz（44 ml），但这不等于所有杯体都必须采用该容量。"),
    ("4. 25 ml 和 35 ml 应该怎么选？", "如果项目涉及英国按杯销售特定烈酒，需要结合当地计量要求和场所采用的份量体系；如果只是出口杯具，则应根据客户实际服务量与杯口余量选型。"),
    ("5. 50 ml 杯能否装 50 ml 后正常饮用？", "不一定。如果 50 ml 指满杯容量，装入 50 ml 时可能几乎没有杯口空间。需要同时确认满杯容量和可用容量。"),
    ("6. 能否根据照片判断容量？", "不能可靠判断。透视、底厚和内部轮廓都会误导。至少需要技术尺寸、重量和容量测量，最好核对实物样品。"),
    ("7. 定制 logo 前要先确认什么？", "确认可印刷区域、工艺、颜色、最小线宽、位置、杯体曲率和最终使用限制，并使用版本化矢量图稿。"),
    ("8. 如何降低大货与样品不一致的风险？", "建立书面规格、批准样、图稿版本、包装样和量产检验标准；任何变化都应重新确认。"),
]
for question, answer in faqs:
    story.append(Paragraph(question, styles["h3"]))
    story.append(para(answer))
story.append(PageBreak())

# Section 13 sources and final checklist
story.extend(section_title("13", "参考来源与重要说明"))
story.append(
    para(
        "以下公开来源用于核对单位换算与特定市场的计量语境。采购合同、标签、广告和当地合规判断仍应结合目标市场的最新规则与专业意见。"
    )
)
story.append(
    Paragraph(
        '1. 美国国家标准与技术研究院（NIST）：Approximate Conversions from U.S. Customary Measures to Metric。用于核对 1 US fl oz 约为 29.57 ml。<br/><link href="https://www.nist.gov/pml/owm/metric-si/unit-conversion/approximate-conversions-us-customary-measures-metric" color="#075989">打开 NIST 来源</link>',
        styles["source"],
    )
)
story.append(
    Paragraph(
        '2. 英国政府：Weights and measures - the law，Specified quantities。用于核对杜松子酒、朗姆酒、伏特加和威士忌按杯销售的 25 ml / 35 ml 指定量语境。<br/><link href="https://www.gov.uk/weights-measures-and-packaging-the-law/specified-quantities" color="#075989">打开 GOV.UK 来源</link>',
        styles["source"],
    )
)
story.append(
    Paragraph(
        '3. 美国酒类烟草税收和贸易局（TTB）：Alcohol FAQs。用于核对 Alcohol Facts 指引中的烈酒份量示例 1.5 fl oz（44 ml）。<br/><link href="https://www.ttb.gov/faqs/alcohol" color="#075989">打开 TTB 来源</link>',
        styles["source"],
    )
)
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("最终下单前的 12 项检查", styles["h3"]))
final_checks = [
    "目标市场和实际使用场景已确认。",
    "标称容量、满杯容量、可用容量的定义没有混淆。",
    "ml 与 US fl oz 换算已核对，文件中的单位一致。",
    "杯高、杯口外径、底部外径和重量已写入规格。",
    "材质、工艺和外观要求有供应商可核实信息支持。",
    "logo 图稿、颜色、尺寸、位置和版本号已锁定。",
    "最终装饰成品的使用限制已确认。",
    "每盒、每箱数量及内隔方案已批准。",
    "外箱尺寸、净重、毛重、箱唛和条码已核对。",
    "批准样有唯一编号，买卖双方都可追溯。",
    "验收项目、公差、抽样和缺陷判定已书面确认。",
    "价格、起订量、库存、交期和任何合规声明均来自当前有效的书面确认。",
]
for item in final_checks:
    story.append(bullet(item))
story.append(Spacer(1, 4 * mm))
story.append(
    callout(
        "结语",
        "正确的烈酒杯不是“最常见的容量”，而是与目标份量、使用场景、品牌表达、包装运输和验收标准共同匹配的规格。先把语言变成数据，再用样品把数据变成可交付的产品。",
    )
)
story.append(Spacer(1, 5 * mm))
story.append(para("© 2026 Glarivo. 本指南供 B2B 采购沟通与教育参考。", "caption"))


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=18 * mm,
    leftMargin=18 * mm,
    topMargin=19 * mm,
    bottomMargin=17 * mm,
    title="Shot Glass（烈酒杯）容量与批发采购指南",
    author="Glarivo",
    subject="烈酒杯容量、规格、定制、包装、询价与样品验收指南",
    creator="Glarivo Content Guide",
)
doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
print(str(OUTPUT))
