/**
 * 地方频道数据：50 州 + 华盛顿哥伦比亚特区
 *
 * I. 数据构成
 *
 * 1. STATES              —— 51 个分站的基础信息（字段见 @/data/types 的 StateInfo）
 * 2. GOVERNOR_ACTIVITIES —— 州长活动条目
 * 3. HOT_STATE_CODES     —— 参考图指定的 6 个热门分站入口
 *
 * II. 写作约定
 *
 * 1. 基础信息（首府、加入联邦日期、昵称）尽量与真实情况一致。真实的地基越结实，
 *    盖在上面的荒谬才越站得住。
 * 2. `blurb` 是一句话吐槽，`feature` 是该州"特色便民服务"。51 个分站的这两项
 *    必须全部不同，且都要落到一个具体的、可执行的、自我矛盾的办理规则上。
 * 3. `heat` 是分站访问热度（虚构）。前 6 名即参考图里的 6 个热门州入口。
 * 4. 禁止感叹号、emoji、网络流行语。讽刺对象是各地政务系统的形式主义，
 *    不是任何真实的州、政府或个人。所有数字均为虚构。
 *
 * III. 确定性工具
 *
 * 分站页面的补充数据（要闻条数、办结量、排队时长等）一律由 `stateHash` /
 * `statePick` 从 code 派生，保证同一分站每次刷新结果完全一致。
 *
 * @module data/states
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import type { ActivityItem, StateInfo } from './types';

/* ================= 一、51 个分站 ================= */

/**
 * 全部分站
 *
 * 按邮政缩写字母序排列；华盛顿哥伦比亚特区不是州，排在最后并单独标注。
 */
export const STATES: StateInfo[] = [
  {
    code: 'AL',
    name: '阿拉巴马州',
    nameEn: 'Alabama',
    capital: '蒙哥马利',
    heat: 2_118_640,
    blurb: '本州办事窗口的工作日为周一至周五，其中周一用于准备，周五用于总结。',
    feature: '火箭城主题驾驶证换证：换证时可在火箭模型前拍照，照片送制证中心，制证周期 90 个工作日。',
    admitted: '1819-12-14',
    nickname: '棉花之州',
  },
  {
    code: 'AK',
    name: '阿拉斯加州',
    nameEn: 'Alaska',
    capital: '朱诺',
    heat: 618_420,
    blurb: '本州部分乡镇不通公路，本州的办事指南同样只在冬季封路时才更新。',
    feature: '极昼延时服务：每年 6 月窗口开放至午夜。理由是当时天还没黑，因此不算加班。',
    admitted: '1959-01-03',
    nickname: '最后的边疆',
  },
  {
    code: 'AZ',
    name: '亚利桑那州',
    nameEn: 'Arizona',
    capital: '凤凰城',
    heat: 3_650_220,
    blurb: '本州夏季室外温度高于体温，本州把排队区设在室内，这是本州唯一的避暑政策。',
    feature: '高温补贴自助申领：气温连续三日超过 43 摄氏度即可申领，申领方式为本人到现场办理。',
    admitted: '1912-02-14',
    nickname: '大峡谷之州',
  },
  {
    code: 'AR',
    name: '阿肯色州',
    nameEn: 'Arkansas',
    capital: '小石城',
    heat: 1_302_740,
    blurb: '本州把"自然"写进了昵称，也把"人工"写进了每一道审批。',
    feature: '钻石坑公园登记：挖到的钻石可当场登记。登记表共 4 页，其中第 3 页需注明钻石的用途。',
    admitted: '1836-06-15',
    nickname: '自然之州',
  },
  {
    code: 'CA',
    name: '加利福尼亚州',
    nameEn: 'California',
    capital: '萨克拉门托',
    heat: 8_660_180,
    blurb: '本州政务系统领先全美，领先主要体现在版本号上。',
    feature: '海滩停车许可在线申请：可在线提交，须线下领取，领取窗口距最近海滩 42 公里。',
    admitted: '1850-09-09',
    nickname: '金州',
  },
  {
    code: 'CO',
    name: '科罗拉多州',
    nameEn: 'Colorado',
    capital: '丹佛',
    heat: 2_560_140,
    blurb: '本州平均海拔 2,073 米，本州窗口的叫号屏也装得比别州高一点。',
    feature: '滑雪季通行证：可在网上预约，预约成功后请到海拔 3,100 米的窗口领取实体卡。',
    admitted: '1876-08-01',
    nickname: '百年之州',
  },
  {
    code: 'CT',
    name: '康涅狄格州',
    nameEn: 'Connecticut',
    capital: '哈特福德',
    heat: 1_604_270,
    blurb: '本州自称宪法之州，本州的办事指南也采用了宪章体，全文共 41 条。',
    feature: '保险理赔咨询：可在州保险厅咨询任何保险问题，咨询时间为每周二上午 09:00 至 11:00。',
    admitted: '1788-01-09',
    nickname: '宪法之州',
  },
  {
    code: 'DE',
    name: '特拉华州',
    nameEn: 'Delaware',
    capital: '多佛',
    heat: 712_630,
    blurb: '本州是第一州，第一个交卷，也是最后一个出结果。',
    feature: '公司注册一日办结：一日指一个工作日，不含受理当日、审核日与出证日，三者均不在同一个工作日。',
    admitted: '1787-12-07',
    nickname: '第一州',
  },
  {
    code: 'FL',
    name: '佛罗里达州',
    nameEn: 'Florida',
    capital: '塔拉哈西',
    heat: 8_904_220,
    blurb: '本州阳光充足，本州办事大厅的空调是全州最有存在感的公共服务。',
    feature: '飓风季预约自动改期：遇飓风自动改期，改期通知于飓风结束后 5 个工作日内发出。',
    admitted: '1845-03-03',
    nickname: '阳光之州',
  },
  {
    code: 'GA',
    name: '佐治亚州',
    nameEn: 'Georgia',
    capital: '亚特兰大',
    heat: 5_412_760,
    blurb: '本州以桃子闻名，本州的排队号码也像桃子一样，一轮一轮地熟。',
    feature: '桃树认养证：认养一棵桃树可获颁证书，办理证书需先提供该桃树的所有权证明。',
    admitted: '1788-01-02',
    nickname: '桃树之州',
  },
  {
    code: 'HI',
    name: '夏威夷州',
    nameEn: 'Hawaii',
    capital: '檀香山',
    heat: 918_740,
    blurb: '本州时间比本土晚 5 小时，本州的办结时限也比本土晚 5 小时。',
    feature: '阿罗哈窗口：本窗口只办理不急的事项。急件请到隔壁窗口，隔壁窗口今日休息。',
    admitted: '1959-08-21',
    nickname: '阿罗哈之州',
  },
  {
    code: 'ID',
    name: '爱达荷州',
    nameEn: 'Idaho',
    capital: '博伊西',
    heat: 1_012_880,
    blurb: '本州盛产土豆，本州的填表说明也像土豆一样，一挖一串。',
    feature: '土豆种植登记：登记表按地块填报，每增加一块地需另附一份地块情况说明。',
    admitted: '1890-07-03',
    nickname: '宝石之州',
  },
  {
    code: 'IL',
    name: '伊利诺伊州',
    nameEn: 'Illinois',
    capital: '斯普林菲尔德',
    heat: 5_987_340,
    blurb: '本州是林肯之地，本州办事指南的篇幅也在向林肯的演讲长度致敬。',
    feature: '停车罚单在线复核：可在线提交复核申请，复核周期 6 个月，复核期间罚单金额按日累计。',
    admitted: '1818-12-03',
    nickname: '林肯之地',
  },
  {
    code: 'IN',
    name: '印第安纳州',
    nameEn: 'Indiana',
    capital: '印第安纳波利斯',
    heat: 3_204_570,
    blurb: '本州各项指标稳定处于全美中游，这是本州唯一稳定保持中游的指标。',
    feature: '赛事周末临时通行证：赛事期间可申请通行，通行区域不含赛道、看台与停车场。',
    admitted: '1816-12-11',
    nickname: '胡希尔之州',
  },
  {
    code: 'IA',
    name: '艾奥瓦州',
    nameEn: 'Iowa',
    capital: '得梅因',
    heat: 1_448_130,
    blurb: '本州是鹰眼之州，最擅长从一万份表格里看出一个签名。',
    feature: '玉米补贴申报：申报窗口开放 3 天，补贴发放周期 11 个月，发放状态请勿重复查询。',
    admitted: '1846-12-28',
    nickname: '鹰眼之州',
  },
  {
    code: 'KS',
    name: '堪萨斯州',
    nameEn: 'Kansas',
    capital: '托皮卡',
    heat: 1_184_920,
    blurb: '本州地势平坦、视野开阔，能一眼望到审批流程的尽头，尽头是一张表。',
    feature: '向日葵田观光许可：许可本身免费，办理许可的手续费 12 美元。',
    admitted: '1861-01-29',
    nickname: '向日葵之州',
  },
  {
    code: 'KY',
    name: '肯塔基州',
    nameEn: 'Kentucky',
    capital: '法兰克福',
    heat: 1_884_560,
    blurb: '本州以赛马闻名，本州的办事流程不以速度取胜，以耐力取胜。',
    feature: '赛马场停车位预约：须提前 30 天预约，预约成功后按到达顺序重新排队。',
    admitted: '1792-06-01',
    nickname: '蓝草之州',
  },
  {
    code: 'LA',
    name: '路易斯安那州',
    nameEn: 'Louisiana',
    capital: '巴吞鲁日',
    heat: 1_987_220,
    blurb: '本州采用教区制，本州的办事辖区划分同样独特，独特到需要单独印发一份说明。',
    feature: '飓风疏散路线查询：查询免费，查询结果以纸质地图为准，纸质地图请在办事大厅一层领取。',
    admitted: '1812-04-30',
    nickname: '鹈鹕之州',
  },
  {
    code: 'ME',
    name: '缅因州',
    nameEn: 'Maine',
    capital: '奥古斯塔',
    heat: 828_940,
    blurb: '本州以龙虾闻名，本州的办结时限也像龙虾一样，需要慢慢煮。',
    feature: '龙虾捕捞许可：许可数量有限，以抽签方式发放，抽签结果于次年 1 月公布。',
    admitted: '1820-03-15',
    nickname: '松树之州',
  },
  {
    code: 'MD',
    name: '马里兰州',
    nameEn: 'Maryland',
    capital: '安纳波利斯',
    heat: 2_884_930,
    blurb: '本州是"老线之州"，本州的办事窗口也画着一条线，线内的业务由另一个窗口办理。',
    feature: '蓝蟹捕捞登记：登记免费，登记前须完成 2 小时线上课程，课程结业证需到现场领取。',
    admitted: '1788-04-28',
    nickname: '老线之州',
  },
  {
    code: 'MA',
    name: '马萨诸塞州',
    nameEn: 'Massachusetts',
    capital: '波士顿',
    heat: 3_884_610,
    blurb: '本州教育资源丰富，本州最难的考试是驾照笔试，第二难的是预约驾照笔试。',
    feature: '居民停车许可：申请材料含居住证明、车辆证明与两位邻居的签字确认。',
    admitted: '1788-02-06',
    nickname: '海湾之州',
  },
  {
    code: 'MI',
    name: '密歇根州',
    nameEn: 'Michigan',
    capital: '兰辛',
    heat: 4_732_510,
    blurb: '本州被五大湖环绕，本州的办事窗口也被五道流程环绕。',
    feature: '车辆年检：可在任一检测站办理。检测站清单每季度更新，本期清单状态为"待更新"。',
    admitted: '1837-01-26',
    nickname: '五大湖之州',
  },
  {
    code: 'MN',
    name: '明尼苏达州',
    nameEn: 'Minnesota',
    capital: '圣保罗',
    heat: 2_408_770,
    blurb: '本州号称万湖之州，本州也有上万种表格，这两个说法都不是夸张。',
    feature: '冬季驾照更新：每年 11 月至次年 3 月可在线更新，线上入口在该时段内进行维护。',
    admitted: '1858-05-11',
    nickname: '万湖之州',
  },
  {
    code: 'MS',
    name: '密西西比州',
    nameEn: 'Mississippi',
    capital: '杰克逊',
    heat: 1_248_560,
    blurb: '本州河流众多，本州的办事流程也秉承"水到渠成"的理念，目前水还没到。',
    feature: '河运许可：须提交航行计划，计划中应包含返航日期与返航方式，两者不得相同。',
    admitted: '1817-12-10',
    nickname: '木兰花之州',
  },
  {
    code: 'MO',
    name: '密苏里州',
    nameEn: 'Missouri',
    capital: '杰斐逊城',
    heat: 3_018_440,
    blurb: '本州别称"索证之州"，本州办事的第一项材料，是证明你确实需要办事。',
    feature: '索证窗口：本窗口专门开具各类证明。开具证明需先提供证明，证明模板在本窗口领取。',
    admitted: '1821-08-10',
    nickname: '索证之州',
  },
  {
    code: 'MT',
    name: '蒙大拿州',
    nameEn: 'Montana',
    capital: '海伦娜',
    heat: 786_510,
    blurb: '本州人口密度全美倒数，本州窗口的排队长度全美前列，因为窗口只有一个。',
    feature: '牧场登记：牧场面积以英亩计，登记表以页计，每 1,000 英亩一页，不足一页按一页计。',
    admitted: '1889-11-08',
    nickname: '宝藏之州',
  },
  {
    code: 'NE',
    name: '内布拉斯加州',
    nameEn: 'Nebraska',
    capital: '林肯',
    heat: 1_064_510,
    blurb: '本州以玉米为荣，本州服务大厅的绿化带里种的就是玉米。',
    feature: '农业机械牌照：牌照可邮寄到家。邮寄范围不含州外，州外居民请到州内领取。',
    admitted: '1867-03-01',
    nickname: '玉米壳之州',
  },
  {
    code: 'NV',
    name: '内华达州',
    nameEn: 'Nevada',
    capital: '卡森城',
    heat: 1_384_620,
    blurb: '本州以 24 小时营业闻名，本州政务大厅也在 24 小时排队，只是窗口 17 点关闭。',
    feature: '24 小时结婚登记，办完可直接在旁边办理离婚预约，预约排期 14 个月。',
    admitted: '1864-10-31',
    nickname: '银之州',
  },
  {
    code: 'NH',
    name: '新罕布什尔州',
    nameEn: 'New Hampshire',
    capital: '康科德',
    heat: 872_160,
    blurb: '本州不设州所得税，本州的手续费项目是全美最丰富的。',
    feature: '车辆登记：须本人到场。到场后填写《本州车辆登记申请表》，请使用本窗口提供的笔。',
    admitted: '1788-06-21',
    nickname: '花岗岩之州',
  },
  {
    code: 'NJ',
    name: '新泽西州',
    nameEn: 'New Jersey',
    capital: '特伦顿',
    heat: 4_510_880,
    blurb: '本州是花园之州，本州的服务大厅在花园旁边，具体是在花园的隔壁的隔壁。',
    feature: '过路费电子账户：可在线开户，开户后须到现场激活，激活点设在各收费站出口。',
    admitted: '1787-12-18',
    nickname: '花园之州',
  },
  {
    code: 'NM',
    name: '新墨西哥州',
    nameEn: 'New Mexico',
    capital: '圣菲',
    heat: 1_122_380,
    blurb: '本州自称"迷人之地"，本州最迷人的是办结时限的计算方法。',
    feature: '热气球节通行证：通行证以抽签方式发放，中签率 3%，未中签者可购买观察区门票。',
    admitted: '1912-01-06',
    nickname: '迷人之地',
  },
  {
    code: 'NY',
    name: '纽约州',
    nameEn: 'New York',
    capital: '奥尔巴尼',
    heat: 7_942_310,
    blurb: '本州是帝国之州，本州的办事队伍也是帝国级的。',
    feature: '交通卡优惠申请：申请通过后，优惠自下一个自然年度的第二个季度起生效。',
    admitted: '1788-07-26',
    nickname: '帝国之州',
  },
  {
    code: 'NC',
    name: '北卡罗来纳州',
    nameEn: 'North Carolina',
    capital: '罗利',
    heat: 5_088_920,
    blurb: '本州是焦油脚跟之州，本州办事大厅的地面也确实有点粘。',
    feature: '烟草种植登记：登记表须注明种植面积与用途，用途一栏建议填写"农业"。',
    admitted: '1789-11-21',
    nickname: '焦油脚跟之州',
  },
  {
    code: 'ND',
    name: '北达科他州',
    nameEn: 'North Dakota',
    capital: '俾斯麦',
    heat: 652_780,
    blurb: '本州是和平花园之州，本州最和平的是办事速度。',
    feature: '冬季道路通行查询：本窗口提供道路通行情况查询，本窗口冬季关闭。',
    admitted: '1889-11-02',
    nickname: '和平花园之州',
  },
  {
    code: 'OH',
    name: '俄亥俄州',
    nameEn: 'Ohio',
    capital: '哥伦布',
    heat: 7_118_900,
    blurb: '本州是七叶树之州，本州的办事流程也像七叶树，枝杈很多，果子不能吃。',
    feature: '车牌抽签：本州部分号段车牌需抽签。未中签者可等待下一轮，下一轮为明年。',
    admitted: '1803-03-01',
    nickname: '七叶树之州',
  },
  {
    code: 'OK',
    name: '俄克拉何马州',
    nameEn: 'Oklahoma',
    capital: '俄克拉何马城',
    heat: 1_688_910,
    blurb: '本州是抢先之州，抢先抢的是排队的第一位，不是办结的第一位。',
    feature: '龙卷风季避难登记：登记后可优先进入避难所，优先顺序按登记时间的倒序排列。',
    admitted: '1907-11-16',
    nickname: '抢先之州',
  },
  {
    code: 'OR',
    name: '俄勒冈州',
    nameEn: 'Oregon',
    capital: '塞勒姆',
    heat: 1_792_330,
    blurb: '本州不设自助加油，本州也不设自助填表，表格一律由窗口代为录入，录入需排队。',
    feature: '海滩通行：本州海滩全部免费开放。免费通行须办理《免费通行证》，工本费 0 元，办理费 5 美元。',
    admitted: '1859-02-14',
    nickname: '海狸之州',
  },
  {
    code: 'PA',
    name: '宾夕法尼亚州',
    nameEn: 'Pennsylvania',
    capital: '哈里斯堡',
    heat: 6_204_880,
    blurb: '本州是拱心石之州，本州的表格也是拱形的，具体表现为第 3 页拱到了第 5 页后面。',
    feature: '历史区导览预约：导览免费，预约费 3 美元，费用用于维护预约系统，该系统暂未上线。',
    admitted: '1787-12-12',
    nickname: '拱心石之州',
  },
  {
    code: 'RI',
    name: '罗得岛州',
    nameEn: 'Rhode Island',
    capital: '普罗维登斯',
    heat: 748_220,
    blurb: '本州面积全美最小，本州的办事指南是全美最厚的。',
    feature: '船舶登记：须提供船舶照片。照片须在登记窗口前拍摄，拍摄设备由窗口提供。',
    admitted: '1790-05-29',
    nickname: '海洋之州',
  },
  {
    code: 'SC',
    name: '南卡罗来纳州',
    nameEn: 'South Carolina',
    capital: '哥伦比亚',
    heat: 2_244_310,
    blurb: '本州是棕榈之州，本州窗口备有一把棕榈扇供排队群众使用，扇子共一把。',
    feature: '海滨房屋租赁登记：登记前须完成消防安全检查，检查排期 8 个月，排期期间不得出租。',
    admitted: '1788-05-23',
    nickname: '棕榈之州',
  },
  {
    code: 'SD',
    name: '南达科他州',
    nameEn: 'South Dakota',
    capital: '皮尔',
    heat: 688_140,
    blurb: '本州以拉什莫尔山闻名，本州的办事流程也刻在石头上。',
    feature: '总统山停车预约：须提前 24 小时预约；取消预约须提前 48 小时，逾时取消按未取消处理。',
    admitted: '1889-11-02',
    nickname: '拉什莫尔山之州',
  },
  {
    code: 'TN',
    name: '田纳西州',
    nameEn: 'Tennessee',
    capital: '纳什维尔',
    heat: 3_412_880,
    blurb: '本州是志愿者之州，本州志愿者很多，正式编制很少。',
    feature: '乡村音乐版权登记：登记免费，须现场演唱一段以证明作品归属，演唱场地需另行预约。',
    admitted: '1796-06-01',
    nickname: '志愿者之州',
  },
  {
    code: 'TX',
    name: '得克萨斯州',
    nameEn: 'Texas',
    capital: '奥斯汀',
    heat: 9_217_640,
    blurb: '本州一切都可以更大，包括办事窗口的排队长度。',
    feature: '本州电网状态查询：可查询本州电网运行情况。查询结果不与其他州共享，其他州亦无法查询本州。',
    admitted: '1845-12-29',
    nickname: '孤星之州',
  },
  {
    code: 'UT',
    name: '犹他州',
    nameEn: 'Utah',
    capital: '盐湖城',
    heat: 1_522_880,
    blurb: '本州是蜂巢之州，本州的办事窗口也像蜂巢，格子很多，每个格子各办各的。',
    feature: '国家公园年票：年票可在任一入口办理。入口 4 号窗口专办年票，4 号窗口常年关闭。',
    admitted: '1896-01-04',
    nickname: '蜂巢之州',
  },
  {
    code: 'VT',
    name: '佛蒙特州',
    nameEn: 'Vermont',
    capital: '蒙彼利埃',
    heat: 584_960,
    blurb: '本州是绿山之州，本州的办事效率保持着山的高度，也保持着山的坡度。',
    feature: '枫糖浆产地证明：须提供枫树数量，数量以棵为单位，且须逐棵编号。',
    admitted: '1791-03-04',
    nickname: '绿山之州',
  },
  {
    code: 'VA',
    name: '弗吉尼亚州',
    nameEn: 'Virginia',
    capital: '里士满',
    heat: 4_286_300,
    blurb: '本州是"老自治领"，本州的窗口也是老资格的，老到只收现金。',
    feature: '出生证明补办：可在线申请，在线申请后请另行邮寄纸质申请，两项不可合并办理。',
    admitted: '1788-06-25',
    nickname: '老自治领',
  },
  {
    code: 'WA',
    name: '华盛顿州',
    nameEn: 'Washington',
    capital: '奥林匹亚',
    heat: 4_022_740,
    blurb: '本州州名与首都重名，本州的办事电话也经常被转到首都。',
    feature: '渡轮预约：预约系统每日 06:00 开放，06:02 显示已满，退订名额不予释放。',
    admitted: '1889-11-11',
    nickname: '常青之州',
  },
  {
    code: 'WV',
    name: '西弗吉尼亚州',
    nameEn: 'West Virginia',
    capital: '查尔斯顿',
    heat: 964_320,
    blurb: '本州是山地之州，本州的办事流程也是山路，弯多、坡陡，看得见终点但到不了。',
    feature: '矿区历史查询：历史资料存于州档案馆，档案馆每周二闭馆，闭馆日不受理查询预约。',
    admitted: '1863-06-20',
    nickname: '山地之州',
  },
  {
    code: 'WI',
    name: '威斯康星州',
    nameEn: 'Wisconsin',
    capital: '麦迪逊',
    heat: 2_712_600,
    blurb: '本州是獾之州，本州最会打洞的是表格的附件要求。',
    feature: '奶酪产地登记：登记后可获颁"奶酪之州"标识。标识申请须另行提交，提交窗口在同一柜台。',
    admitted: '1848-05-29',
    nickname: '獾之州',
  },
  {
    code: 'WY',
    name: '怀俄明州',
    nameEn: 'Wyoming',
    capital: '夏延',
    heat: 548_320,
    blurb: '本州是平等之州，人人平等，人人都要排队。',
    feature:
      '牧场围栏许可：许可免费。办理许可须提交围栏图纸，图纸须由注册测量师签署，本州注册测量师共 2 名。',
    admitted: '1890-07-10',
    nickname: '平等之州',
  },
  {
    code: 'DC',
    name: '华盛顿哥伦比亚特区',
    nameEn: 'District of Columbia',
    capital: '本区即首府',
    heat: 9_842_110,
    blurb: '本区不是州，本区的办事机构也像本区的地位一样属于联邦直辖，具体归谁管需另行确认。',
    feature: '联邦机构导览预约：一次预约可参观 3 个机构，机构名单于预约当天公布。',
    admitted: '1801-02-27（联邦直辖）',
    nickname: '首都特区',
  },
];

/* ================= 二、州长活动 ================= */

/** 州长活动：用于「州长活动」tab */
export const GOVERNOR_ACTIVITIES: ActivityItem[] = [
  {
    id: 'gov-act-001',
    date: '2026-09-26',
    title: '得克萨斯州州长视察本州网上办事大厅，现场体验"一次办结"，体验事项为"预约下一次体验"',
    leaderId: 'ldr-005',
    location: '得克萨斯州',
  },
  {
    id: 'gov-act-002',
    date: '2026-09-19',
    title: '加利福尼亚州州长宣布本州政务系统升级完成，升级后版本号为 2.0.1',
    leaderId: 'ldr-003',
    location: '加利福尼亚州',
  },
  {
    id: 'gov-act-003',
    date: '2026-09-12',
    title: '佛罗里达州州长主持召开本州飓风季便民服务保障会议，会议决定会后另发会议纪要',
    leaderId: 'ldr-004',
    location: '佛罗里达州',
  },
  {
    id: 'gov-act-004',
    date: '2026-09-04',
    title: '纽约州州长调研本州排队时长治理工作，调研全过程未排队',
    leaderId: 'ldr-003',
    location: '纽约州',
  },
  {
    id: 'gov-act-005',
    date: '2026-08-28',
    title: '俄亥俄州州长出席本州车牌抽签仪式，抽签仪式因系统维护延期举行',
    leaderId: 'ldr-004',
    location: '俄亥俄州',
  },
  {
    id: 'gov-act-006',
    date: '2026-08-20',
    title: '华盛顿哥伦比亚特区市长宣布联邦机构导览预约系统上线，上线首日访问量 0 人次',
    leaderId: 'ldr-002',
    location: '华盛顿哥伦比亚特区',
  },
  {
    id: 'gov-act-007',
    date: '2026-08-13',
    title: '内华达州州长视察 24 小时结婚登记窗口，视察时间 17:05，窗口已关闭',
    leaderId: 'ldr-005',
    location: '内华达州',
  },
  {
    id: 'gov-act-008',
    date: '2026-08-05',
    title: '阿拉斯加州州长调研极昼延时服务开展情况，调研当日当地为极夜',
    leaderId: 'ldr-005',
    location: '阿拉斯加州',
  },
  {
    id: 'gov-act-009',
    date: '2026-07-29',
    title: '蒙大拿州州长召开牧场登记简化座谈会，会后新增登记事项 2 项',
    leaderId: 'ldr-004',
    location: '蒙大拿州',
  },
  {
    id: 'gov-act-010',
    date: '2026-07-21',
    title: '缅因州州长出席龙虾捕捞许可抽签，抽签结果将于次年 1 月公布',
    leaderId: 'ldr-005',
    location: '缅因州',
  },
  {
    id: 'gov-act-011',
    date: '2026-07-14',
    title: '密苏里州州长体验本州"索证窗口"，体验所需证明正在办理中',
    leaderId: 'ldr-004',
    location: '密苏里州',
  },
  {
    id: 'gov-act-012',
    date: '2026-07-06',
    title: '夏威夷州州长视察阿罗哈窗口，隔壁窗口当日休息',
    leaderId: 'ldr-005',
    location: '夏威夷州',
  },
  {
    id: 'gov-act-013',
    date: '2026-06-28',
    title: '艾奥瓦州州长宣布玉米补贴发放时间提前，提前幅度为 0 天',
    leaderId: 'ldr-003',
    location: '艾奥瓦州',
  },
  {
    id: 'gov-act-014',
    date: '2026-06-19',
    title: '西弗吉尼亚州州长调研矿区历史查询工作，州档案馆当日闭馆',
    leaderId: 'ldr-004',
    location: '西弗吉尼亚州',
  },
  {
    id: 'gov-act-015',
    date: '2026-06-11',
    title: '华盛顿州州长检查渡轮预约系统，检查开始时当日名额已于 06:02 约满',
    leaderId: 'ldr-005',
    location: '华盛顿州',
  },
  {
    id: 'gov-act-016',
    date: '2026-05-30',
    title: '得克萨斯州州长宣布本州电网查询服务不与其他州共享，其他州表示理解',
    leaderId: 'ldr-003',
    location: '得克萨斯州',
  },
  {
    id: 'gov-act-017',
    date: '2026-05-22',
    title: '明尼苏达州州长视察冬季驾照更新线上入口，视察期间入口处于维护状态',
    leaderId: 'ldr-005',
    location: '明尼苏达州',
  },
  {
    id: 'gov-act-018',
    date: '2026-05-13',
    title: '佛蒙特州州长就枫糖浆产地证明逐棵编号工作作出批示，批示全文 2 页',
    leaderId: 'ldr-004',
    location: '佛蒙特州',
  },
  {
    id: 'gov-act-019',
    date: '2026-04-28',
    title: '罗得岛州州长调研本州办事指南厚度问题，调研报告厚 68 页',
    leaderId: 'ldr-002',
    location: '罗得岛州',
  },
  {
    id: 'gov-act-020',
    date: '2026-04-16',
    title: '宾夕法尼亚州州长出席历史区导览预约系统上线仪式，系统暂未上线',
    leaderId: 'ldr-002',
    location: '宾夕法尼亚州',
  },
];

/* ================= 三、常用入口与工具函数 ================= */

/** 参考图指定的 6 个热门分站入口，顺序与参考图一致 */
export const HOT_STATE_CODES = ['DC', 'TX', 'FL', 'CA', 'NY', 'OH'];

/** 分站总数（50 州 + 首都特区） */
export const STATE_TOTAL = STATES.length;

/**
 * 按邮政缩写查分站
 *
 * @param code - 两位邮政缩写，大小写不敏感
 * @returns 命中的分站信息；未命中返回 undefined
 */
export function findState(code: string | undefined): StateInfo | undefined {
  if (!code) return undefined;
  const key = code.trim().toUpperCase();
  return STATES.find((s) => s.code === key);
}

/**
 * 按热度降序排列的全部分站
 *
 * @returns 新的数组（不修改原数据）
 */
export function statesByHeat(): StateInfo[] {
  return [...STATES].sort((a, b) => b.heat - a.heat);
}

/**
 * 热度最高的前 n 个分站
 *
 * @param n - 取几条，默认 6（即参考图的 6 个热门入口）
 * @returns 分站数组
 */
export function hotStates(n = 6): StateInfo[] {
  return statesByHeat().slice(0, Math.max(0, n));
}

/**
 * 由字符串派生一个稳定的非负整数
 *
 * 采用 FNV-1a 变体，保证同一 code 在任何环境、任何时间得到同一个结果。
 * 分站页面的全部补充数据都从这里派生，不使用 Math.random。
 *
 * @param input - 任意字符串（通常是州缩写，有时带盐值）
 * @returns 32 位非负整数
 */
export function stateHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * 从 code 派生一个区间内的确定性整数
 *
 * @param code - 州缩写
 * @param salt - 用途编号，保证同一分站的不同指标互不相关
 * @param min  - 下界（含）
 * @param max  - 上界（含）
 * @returns [min, max] 内的整数
 */
export function statePick(code: string, salt: number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = hi - lo + 1;
  return lo + (stateHash(`${code}#${salt}`) % span);
}

/**
 * 从数组里按 code 确定性地取一项
 *
 * @param code - 州缩写
 * @param salt - 用途编号
 * @param list - 候选数组
 * @returns 命中的元素；数组为空时返回 undefined
 */
export function statePickOne<T>(code: string, salt: number, list: T[]): T | undefined {
  if (list.length === 0) return undefined;
  return list[stateHash(`${code}#${salt}`) % list.length];
}
