import React, {MouseEvent, TouchEvent, useEffect, useState} from "react";
import {useRouteMatch} from "react-router-dom";
import { css } from "@emotion/react";
import Avatar from "@components/Avatar/Avatar";
import palette from "@styles/palette";
import media from "@styles/media";
import {numberToKorean, openNewWindow} from "@utils/common";
import CampaignCard2 from "@components/CampaignCard2/CampaignCard2";
import SVGIcon from "@components/SVGIcon/SVGIcon";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { useMediaQuery } from "react-responsive";
import ReactTooltip from "react-tooltip";
import gapPolyfill from "@styles/gapPolyfill";
import PageButton, {getLastPage} from "@components/Button/PageButton";
import {setUnLikeInfluencer, setLikeInfluencer, postApiWithHeader} from "@statics/getApi";
import NeedLogin from "@components/NeedLogin/NeedLogin";
import {Ilist, snsplatform, SnsPlatformCountLikeCollect, SnsPlatformIcon, TypeId} from "@statics/config";
import {BarChartOption, DonutChartOption, LineChartOption} from "@utils/chartoption";
import "./WanghongDetail.css";

interface MatchParams{
  id: string;
}

interface CountKeywordProps {
  user: {
    id: number;
  };
  id: number;
  header: any;
  page_limit: number;
}

function EngageRateQuestion(id:number | undefined){
  switch (id){
    case 1: return '(찜하기 + 좋아요 + 댓글) / 팔로워';
    case 4: return '(좋아요 + 댓글) / 팔로워';
    default: return ''
  }
}

function CountKeyword ({user, id, header, page_limit}: CountKeywordProps) {
  const [keywordData, setKeywordData] = useState<{keyword:string, count: number}[]>([]);

  const [keywordTotal, setKeywordTotal] = useState(0);
  const [keywordPage, setKeywordPage] = useState(0);
  const keyword_list_size = 6;
  const [keywordLastPage, setKeywordLastPage] = useState(0);
  // @ts-ignore
  useEffect(async () => {
    if (user) {
      // 키워드 카운팅 API
      const param = {
        login_id: user.id,
        influencer_sns_profile_id: id,
        list_size: keyword_list_size,
        page: keywordPage + 1
      }
      const url = `${process.env.REACT_APP_SERVER_BASE_URL}/api/influencer/keywords/profile_id`;
      const keywords = await postApiWithHeader({param, url, header})
      if (!keywords.error) {
        const keyword: {keyword: string, count: number} [] = []
        for (const key in keywords.result) {
          keyword.push({keyword: key, count: keywords.result[key]})
        }
        setKeywordData(keyword)
        setKeywordTotal(keywords.total)
        setKeywordLastPage(getLastPage(keywords.total, keyword_list_size))
      }
    }
  }, [keywordPage])

  return(
    <div className="inner-wrap" css={hashTagWrap}>
      <div className="title">
        <span>키워드</span>
        <i data-tip data-for="hashTag">
          <SVGIcon name={"question"} />
        </i>
        <ReactTooltip
          id="hashTag"
          place={"right"}
          type={"dark"}
          effect={"solid"}
          multiline={true}
          className={"custom-tooltip"}
        >
          <span>
            인플루언서가 게시글을 업로드시<br/>
            사용된 키워드와 횟수 보여줍니다.
          </span>
        </ReactTooltip>
      </div>
      <div className="index">
        총 {keywordTotal}개 키워드 {
        (keywordPage*keyword_list_size)+1}~{(keywordPage+1)*keyword_list_size}번쨰
      </div>
      <div className="content-wrap">
        <div className="hash-tag-wrap">
          {/*
            hashTagData?.[hashTagPage] &&
          // @ts-ignore
            (hashTagData[hashTagPage] || []).map((props, i) => (
              <div className="hash-tag" key={i}>
                <div className="hash-tag-name">{props.tagName}</div>
                <div className="hash-tag-post-count">
                  <label>게시물 수</label>
                  <span>{props.postCount}회</span>
                </div>
              </div>
            ))*/}
            {keywordData?.[0] ?
                // @ts-ignore
              (keywordData.map((props, i) => (
                  <div className="hash-tag" key={i}>
                    <div className="hash-tag-name">{props.keyword}</div>
                    <div className="hash-tag-post-count">
                      <label>게시물 수</label>
                      <span>{props.count}회</span>
                    </div>
                  </div>
              ))):(
                <h1 css={css`margin-left: 2.3rem; font-weight:bold;`}>COMING SOON</h1>
              )}
        </div>
        <div css={css`margin-bottom: -3.8rem; ${media.small} {margin-bottom: -2.4rem;}`}>
          <PageButton
            page={keywordPage}
            setPage={setKeywordPage}
            page_limit={page_limit}
            last_page={keywordLastPage}
          />
        </div>
      </div>
    </div>
  );
}

function WanghongDetail() {
  // @ts-ignore
  const user = JSON.parse(localStorage.getItem('user'))
  let type = 0
  let userId: number | null = null
  const Token = localStorage.getItem('Authorization')
  const header = {"Authorization": Token}
  const is_brand = TypeId(type) === 'brand'
  const match = useRouteMatch<MatchParams>();
  const {id} = match.params
  const isMobile = useMediaQuery({ query: `(max-width: 768px)` });
  const [brandsData, setBrandsData] = useState<{collabo_brand_name:string, count: number}[]>([]);
  const [likeInfluencerId, setLikeInfluencerId] = useState<number>(0)
  const [profile, setProfile] = useState<any>()
  const [stats, setStats] = useState<any>()
  const [fanprovince, setFanprovince] = useState<any>()
  const [post, setPost] = useState<any>()
  const [wished, setWished] = useState(false);
  const [categoryId, setCategoryId] = useState<Ilist[]>([])
  const [rate_fan_men, setRateFanMen] = useState(100);
  const [rate_fan_women, setRateFanWomen] = useState(0);
  const [fansOverallDateList, setFansOverallDateList] = useState<string[]>([]);
  const [fansOverallFansNumList, setFansOverallFansNumList] = useState<number[]>([]);
  const [is_month, setIsMonth] = useState<boolean>(false)
  const fansOverallListSize = isMobile ? 4 : 10;
  const [pointInfluence, setPointInfluence] = useState<number>()
  // page
  const [brandTotal, setBrandTotal] = useState(0);
  const [brandPage, setBrandPage] = useState(0)
  const brand_list_size = 6;
  const [brandLastPage, setBrandLastPage] = useState(0);
const [보이기1,숨기기1]=useState(false);
  const [campaignPage, setCampaignPage] = useState(0);
  const [campaignTotal, setCampaignTotal] = useState(0);
  const page_limit = 3;
  const campaign_list_size = 4;
  let campaign_last_page = getLastPage(campaignTotal, campaign_list_size);

  let rate_fan_province: number[] = [100];
  let List_province = [];
  let rate_fan_ages:number[] = [100];
  const age = ['rate_fan_under_18', 'rate_fan_18_24', 'rate_fan_25_34', 'rate_fan_35_49', 'rate_fan_over_50']
  let groupAvgBarData: number[] = [0, 0, 0, 0, 0, 0];
  let avgBarData: number[] = [0, 0, 0, 0, 0, 0];
  const phoneNumber = '-';
  const email = '-';
  // const arrivalCount = '-';
  // const influenceIndices = '-';
  const barColors = ["#dfe4e9", "#ffa5ba"]
  const donutColor1 = ["#a0d7e7", "#ffd506"]
  const donutColor2 = ["#a0d7e7", "#a0b4e7", "#f16063", "#f1a460", "#ffd506"
    , "#b0ff06", "#66cb9f", "#66c6cb", "#b9a8ec", "#dba8ec", "#D3D3D3"];
  const donutColor3 = ["#a0d7e7", "#f16063", "#ffd506", "#66cb9f", "#b9a8ec"];
  const donutSize = '80%'
  const minEstimatedSales = 0;
  const maxEstimatedSales = 0;
  const avg: {id: number, data: string}[] = [];
  const barTitles: {id: number, name_ko:string}[][] = []
  if (profile) {
    if (profile.sns_platform_id.id === snsplatform.xiaohongshu) {
      avg.push(
          {id: 0, data: 'engage_rate'},
          {id: 1, data: 'follower'},
          {id: 2, data: 'avg_like'},
          {id: 3, data: 'avg_comment'},
          {id: 4, data: 'avg_fav'},
          {id: 5, data: 'avg_read'},
      )
      barTitles.push(
          [{id: 0, name_ko: "평균 반응률"}, {id: 1, name_ko: "평균 팔로워"}],
          [{id: 2, name_ko: "평균 좋아요 수"}, {id: 3, name_ko: "평균 댓글 수"}],
          [{id: 4, name_ko: "평균 찜하기 수"}, {id: 5, name_ko: "평균 조회수"}],
      )
    } else if (profile.sns_platform_id.id === snsplatform.douyin) {
      avg.push(
          {id: 0, data: 'engage_rate'},
          {id: 1, data: 'follower'},
          {id: 2, data: 'avg_like'},
          {id: 3, data: 'avg_comment'},
      )
      barTitles.push(
          [{id: 0, name_ko: "평균 반응률"}, {id: 1, name_ko: "평균 팔로워"}],
          [{id: 2, name_ko: "평균 좋아요 수"}, {id: 3, name_ko: "평균 댓글 수"}],
      )
    }
  }

  if (!user) {
    return (<NeedLogin></NeedLogin>);
  } else {
    type = user.type_id
    userId = user.id
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(
      // @ts-ignore
    async () => {
    // 팬수 변화 API 호출
    const fansOverallPage = 1;
    const fansOverallSort = 'date_key'
    const param = {
      login_id: userId,
      page: fansOverallPage,
      list_size: fansOverallListSize,
      sort: fansOverallSort,
      asc: -1,
      influencer_sns_profile_id: Number(id),
      is_month: is_month,
    };
    const url = `${process.env.REACT_APP_SERVER_BASE_URL}/api/influencer/fansoverall/profile_id`;
    const fansoverall = await postApiWithHeader({param, url, header});
    if (!fansoverall.error) {
      const DateList: string[] = [];
      const FansList: number[] = [];
      for (const elem of fansoverall.result) {
        DateList.push(elem.date_key);
        FansList.push(elem.fans_num);
      };
      setFansOverallDateList(DateList.reverse())
      setFansOverallFansNumList(FansList.reverse())
    }
  },[is_month])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(// @ts-ignore
      async () => {
    // 왕홍 상세정보 API
    const param = {
      login_id: userId,
      id: Number(id)
    };
    const url = `${process.env.REACT_APP_SERVER_BASE_URL}/api/influencer/profile/id`;
    const profileData = await postApiWithHeader({param, url, header});
    if (!profileData.error) {
      setProfile(profileData.result);
      setCategoryId([profileData.result.category_id]);
      if (profileData.result.like_influencer.id) {
        setLikeInfluencerId(profileData.result.like_influencer.id)
        setWished(true)
      }
    }
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(// @ts-ignore
      async () => {
    if (user) {
      // 브랜드 카운팅 API
      const param = {
        login_id: user.id,
        influencer_sns_profile_id: Number(id),
        list_size: brand_list_size,
        page: brandPage + 1,
      }
      const url = `${process.env.REACT_APP_SERVER_BASE_URL}/api/influencer/brands/profile_id`;
      const brand = await postApiWithHeader({param, url, header})
      if (!brand.error) {
        setBrandsData(brand.result)
        setBrandTotal(brand.total)
        setBrandLastPage(getLastPage(brand.total, brand_list_size))
      }
    }
  }, [brandPage])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(// @ts-ignore
      async () => {
    // 왕홍 팬 상세정보 API
    if (user) {
      const param = {
        login_id: userId,
        influencer_sns_profile_id: Number(id),
      }
      const url = `${process.env.REACT_APP_SERVER_BASE_URL}/api/influencer/stats/profile_id`;
      const statsData = await postApiWithHeader({param, header, url})
      if (!statsData.error) {
        setStats(statsData.result)
        if (statsData.result.point_influence) setPointInfluence(statsData.result.point_influence)
        if (statsData.result.rate_fan_women && statsData.result.rate_fan_men) {
          setRateFanMen(Number((statsData.result.rate_fan_men * 100).toFixed(2)));
          setRateFanWomen(Number((statsData.result.rate_fan_women * 100).toFixed(2)));
        }
      }
    }
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(// @ts-ignore
      async () => {
    // 왕홍 팬 지역분포도도 API
    if (user) {
      const provincePage: number = 1;
      const provinceListSize: number = 10;
      const provinceSort: string = "rate_fan_province";
      const param = {
        login_id: userId,
        influencer_sns_profile_id: Number(id),
        page: provincePage,
        list_size: provinceListSize,
        sort: provinceSort,
        asc: -1,
      }
      const url = `${process.env.REACT_APP_SERVER_BASE_URL}/api/influencer/province/profile_id`;
      const fanProvinceData = await postApiWithHeader({param, header, url})
      if (!fanProvinceData.error) {
        if (fanProvinceData.result.length > 0) {
          setFanprovince(fanProvinceData.result)
        }
      }
    }
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(// @ts-ignore
      async () => {
    // 왕홍 업로드 게시글 API
    if (user) {
      const postSort: string = "date_posted";
      const param = {
        login_id: userId,
        page: campaignPage+1,
        list_size: campaign_list_size,
        sort: postSort,
        asc: -1,
        influencer_sns_profile_id: Number(id)
      };
      const url = `${process.env.REACT_APP_SERVER_BASE_URL}/api/influencer/post/profile_id`;
      const postData = await postApiWithHeader({param, url, header});
      if (!postData.error) {
        setPost(postData.result)
        setCampaignTotal(postData.total)
      }
    }
  },[campaignPage])

  if (!post || !profile) return <h1>loading</h1>;
  // 연령별 팬 보유비율
  if (stats) {
    if (stats.rate_fan_women && stats.rate_fan_men) {
      const fanAges: number[] = []
      for (const elem of age) {
        fanAges.push(Number((stats[elem] * 100).toFixed(2)))
      }
      rate_fan_ages = fanAges;
    }
  }

  // 지역별 팬비율
  if (fanprovince) {
    rate_fan_province[fanprovince.length] = 100;
    List_province[fanprovince.length] = "기타";

    for (let i = 0; i < fanprovince.length; i++) {
      rate_fan_province[i] = Number((fanprovince[i].rate_fan_province * 100).toFixed(2));
      rate_fan_province[fanprovince.length] = Number((rate_fan_province[fanprovince.length] - rate_fan_province[i]).toFixed(2));
      List_province[i] = fanprovince[i].province;
    };
  }

  let total_size_price = '1'
  for (let i=0; i < profile.normal_post_price.toString().length - 4; i++){
    total_size_price = total_size_price + '0'
  }
  const total_size_salesPostCost = Number(total_size_price) * 2
  total_size_price = '1'
   for (let i=0; i < profile.video_post_price.toString().length - 4; i++){
    total_size_price = `${total_size_price}0`
  }
  const total_size_sponsorshipExposurePostCostt = Number(total_size_price) * 2
  // 평균 비교
  if (stats) {
    for (const elem of avg) {
      if (elem.id === 0){
        if (stats[`${elem.data}_2`]) {avgBarData[elem.id] = Number((stats[`${elem.data}_2`]).toFixed(3))}
        if (stats[`total_${elem.data}`]) {
          groupAvgBarData[elem.id] = Number((stats[`total_${elem.data}`]).toFixed(3))
        }
        continue
      }
      if (elem.id === 1){
        if (profile[`count_${elem.data}`]) {avgBarData[elem.id] = Number((profile[`count_${elem.data}`]).toFixed())}
        if (stats[`total_avg_${elem.data}`]) {
          groupAvgBarData[elem.id] = Number((stats[`total_avg_${elem.data}`]).toFixed())
        }
        continue
      }
      if (stats[elem.data]) {avgBarData[elem.id] = Number((stats[elem.data]).toFixed())}
      if (stats[`total_${elem.data}`]) {groupAvgBarData[elem.id] = Number((stats[`total_${elem.data}`]).toFixed())}
    }
  }
  const donutSeries1 = [rate_fan_men, rate_fan_women];
  const donutSeries2 = rate_fan_province;
  const donutSeries3 = rate_fan_ages;
  const ages = ['18세 이하', "18 ~ 24세", "25 ~ 34세", "35 ~ 49세", "50세 이상"]

  const lineOptions: ApexOptions = LineChartOption(
    !is_month ? ['#dba8ec'] : ['#a0d7e7'],
    fansOverallDateList,
    isMobile
  )

   const lineOptions1: ApexOptions = LineChartOption(
    !is_month ? ['#ffa5ba'] : ['#a0d7e7'],
    fansOverallDateList,
    isMobile
  )
  const barOptions: ApexOptions = BarChartOption(barColors, isMobile);
  const donutOptions1: ApexOptions = DonutChartOption(donutColor1, donutSize)
  const donutOptions2: ApexOptions = DonutChartOption(donutColor2, donutSize)
  const donutOptions3: ApexOptions = DonutChartOption(donutColor3, donutSize)

  const handleWish = async (
      event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    event.preventDefault();
    if (wished) {
      await setUnLikeInfluencer(userId, likeInfluencerId, userId);
    } else {
      const data = await setLikeInfluencer(userId, Number(id), userId);
      // @ts-ignore
      setLikeInfluencerId(data.id)
    }
    setWished(!wished);
  }

  const setPostUrl = (post_id:string, postUrl: string, sns_id: string) => {
    // @ts-ignore
    if (profile.sns_platform_id.id === 2){
      return postUrl.replace('{sns_id}', sns_id).replace('{post_id}', post_id)
    } else {
      return `${postUrl.replace('{post_id}', post_id)}`
    }
  }



  return (
    <div css={wanghongDetail}>
      <div css={wanghongInfoWrap(pointInfluence !== undefined ? 100 - pointInfluence : 100, wished)}>
        <div className="top-wrap">
          <div className="left-wrap">
            <div className="top">
              {is_brand && (
                <button
                    className="wish-button"
                    onClick={isMobile ? () => null : handleWish}
                    onTouchStart={isMobile ? handleWish : () => null}
                >
                  {isMobile ? (
                      <SVGIcon name={"zzim_ic"}/>
                  ) : (
                    <>
                      <SVGIcon
                          name={wished ? "zzim_small_white_ic" : "zzim_small_ic"}
                      />
                      찜하기
                    </>
                  )}
                </button>
              )}
              <div className="img-wrap">
                <Avatar
                  url={profile.original_thumbnail_url}
                  size={"Large"}
                  name={profile.nickname}
                />
              </div>
              <div className="main-info-wrap">
                <div className="id">{profile.nickname}</div>
                {isMobile && <div className="channel">{ profile.sns_platform_id.name_ko }</div>}
                <div className="counts-wrap">
                  <div className="count-group">
                    <div className="count-wrap">
                      <label>게시물</label>
                      <span>{profile.count_post}</span>
                    </div>
                    <div className="count-wrap">
                      <label>팔로워</label>
                      <span>{numberToKorean(profile.count_follower)}명</span>
                    </div>
                  </div>
                  <div className="count-group">
                    <div className="count-wrap">
                      <label>팔로잉</label>
                      <span>{numberToKorean(profile.count_following)}</span>
                    </div>
                    <div className="count-wrap">
                      <label>{SnsPlatformCountLikeCollect(profile.sns_platform_id.id)}</label>
                      <span>{numberToKorean(profile.count_like_collect)}</span>
                    </div>
                  </div>
                </div>
                <div css={categoriesWrap}>
                  {// @ts-ignore
                    categoryId.map((category) => (
                        <div key={category.name_ko}>{category.name_ko}</div>
                    ))}
                </div>
              </div>
            </div>
            <div className="bottom">
              {isMobile ? (
                <div className="mobile-info-wrap">
                  <div className="info-wrap">
                    <label>전화번호</label>
                    <span>{phoneNumber}</span>
                  </div>
                  <div className="info-wrap">
                    <label>이메일</label>
                    <span>{email}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="info-wrap">
                    <label>전화번호</label>
                    <span>{phoneNumber}</span>
                  </div>
                  <div className="info-wrap">
                    <label>이메일</label>
                    <span>{email}</span>
                  </div>
                </>
              )}
              <div className="info-wrap">
                <label>프로필</label>
                {// @ts-ignore
                  profile.description.split('\n').map((description)=>(
                  <span>{description}</span>
                ))}
              </div>
              <div className="info-wrap">
                <label>SNS URL</label>
                <div
                  className="sns-icon"
                  onClick={() => {
                    openNewWindow({
                      sns_platform_id: profile.sns_platform_id.id,
                      sns_platform_url: profile.sns_platform_id.profile_path.replace("{sns_id}", profile.sns_id)
                    })
                  }}
                >
                  <SVGIcon
                    css={css`max-width: 2.6rem; max-height:2.6rem; margin-left:0.55rem; cursor: pointer;`}
                    // @ts-ignore
                    name={SnsPlatformIcon(profile.sns_platform_id.id)} />
                </div>
              </div>
            </div>
          </div>
          <div className="right-wrap">
            <div className="rank">
              <label>랭킹</label>
              <div className="content-wrap">
                <span className="content">
                  { stats && stats.rank ? `${stats.rank} 위` : '집계중'}
                </span>
                {/*<span className="sub-content">KIDS</span>*/}
              </div>
            </div>
            <div className="audience">
              <label>반응률 백분위</label>
              <div className="audience-wrap">
                {/*<SVGIcon name={"south_korea"} />*/}
                <div className="progress-wrap">
                  {stats && pointInfluence !== undefined ? (
                    <div className="progress-text">
                      <span>상위({categoryId.length !== 0 && categoryId[0].name_ko})</span>
                      <span>{pointInfluence}%</span>
                    </div>
                  ) : (
                     <div className="progress-text">
                       <span>준비중입니다.</span>
                       <span>{0}%</span>
                    </div>
                  )}
                  <div className="progress-bar">
                    <div className="progress" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bottom-wrap">
          <div css={subInfoCard(true)}>
            <label>팔로워 수</label>
            <div className="content">
              <span>{numberToKorean(profile.count_follower)}명</span>
              {/*<div css={badge("good")}>Good</div>*/}
            </div>
          </div>
          <div css={subInfoCard(true)}>
            <label>반응률</label>
            <div className="content">
              <span>{stats && stats.engage_rate_2 ? Number((stats.engage_rate_2).toFixed(3)) : 0}%</span>
              {/*<div css={badge("bad")}>Bad</div>*/}
              <div css={innerWrap}>
                <i data-tip data-for="reaction">
                    <SVGIcon name={"question"} />
                </i>
                <ReactTooltip
                  id="reaction"
                  place={"right"}
                  type={"dark"}
                  effect={"solid"}
                  multiline={true}
                  className={"custom-tooltip"}
                >
                  <span>
                    반응률이란<br/>
                    {EngageRateQuestion(profile.sns_platform_id.id)}
                  </span>
                </ReactTooltip>
              </div>
            </div>
          </div>
          <div css={subInfoCard(true)}>
            <label>긍정 댓글율/부정 댓글율</label>
            <div className="content">
              <span>
                {profile.positive_rate ? `${(profile.positive_rate * 100).toFixed(2)}%` : '집계 중입니다.'}
              </span>
              {/* toLocaleString(): number 입력시 string으로 변경 */}
              {/*arrivalCount.toLocaleString()*/}
              {/*<div css={badge("notBad")}>Not bad</div>*/}
              {/*
                <div css={innerWrap}>
                  <i data-tip data-for="arrival">
                    <SVGIcon name={"question"}/>
                  </i>
                  <ReactTooltip
                      id="arrival"
                      place={"right"}
                      type={"dark"}
                      effect={"solid"}
                      multiline={true}
                      className={"custom-tooltip"}
                  >
                  <span>
                    COMING SOON
                  </span>
                  </ReactTooltip>
                </div>
              */}
            </div>
          </div>
          <div css={subInfoCard(true)}>
            <label>라이브 지수</label>
            <div className="content">
              <span>
                {profile.negative_rate ? `${(profile.negative_rate * 100).toFixed(2)}%` : '집계 중입니다.'}
              </span>
              {/* toLocaleString(): number 입력시 string으로 변경 */}
              {/*influenceIndices.toLocaleString()*/}
              {/*
                <div css={innerWrap}>
                  <i data-tip data-for="influence">
                    <SVGIcon name={"question"}/>
                  </i>
                  <ReactTooltip
                      id="influence"
                      place={"left"}
                      type={"dark"}
                      effect={"solid"}
                      multiline={true}
                      className={"custom-tooltip"}
                  >
                  <span>
                    COMING SOON
                  </span>
                  </ReactTooltip>
                </div>
              */}
            </div>
          </div>
        </div>
      </div>

      <div css={reactionChartWrap}>
        <div className="title">반응</div>
        <div className="chart-wrap">
          <div className="title">평균값 비교</div>
          <div className="point-wrap">
            <div className="point" css={css`font-weight: bold;`}>
              <i />
              그룹평균
            </div>
            <div className="point" css={css`font-weight: bold;`}>
              <i />
              {profile.nickname}
            </div>
          </div>
          {barTitles.length !== 0 && barTitles.map((barTitle) => (
          <div className="bar-chart-wrap">
            {barTitle.map((props) => (
              <div className='bar-chart'>
                <div className='bar-chart-title'>{props.name_ko}</div>
                <Chart
                  options={barOptions}
                  series={[
                    {name: "그룹평균", data: [groupAvgBarData[props.id]],},
                    {name: profile.nickname, data: [avgBarData[props.id]],}
                  ]}
                  type="bar"
                  height="302"
                  css={css`
                    width: 100%;
                  `}
                />
              </div>
            ))}
          </div>
          ))}
        </div>
        {(fansOverallFansNumList.length !== 0 ) &&
          <div className="chart-wrap">
            <div className="title">기간별 팬수</div>
            <div className="sort-selected-wrap">
              <div className="sort-selected">
                <button
                  className={!is_month ? 'active' : ''}
                  onClick={() => setIsMonth(false)}
                >
                  주간별 팬수
                </button>
              </div>
              <div className="sort-selected">
                <button
                  className={is_month ? 'active' : ''}
                  onClick={() => setIsMonth(true)}
                >
                  월간별 팬수
                </button>
              </div>
            </div>


            <div className="line-chart-wrap">
              <Chart
                  options={lineOptions}
                  series={
                    !is_month ? [{name: '주간 팬수', data: fansOverallFansNumList,},]
                        : [{name: '월간 팬수', data: fansOverallFansNumList,},]
                  }
                  type="line"
                  height='302'
                  css={css`
                    width: 100%;
                  `}
              />
            </div>
          </div>
        }
        {profile.sns_platform_id.id !== snsplatform.douyin &&
          <div className="chart-wrap">
            <div className="title">팬 유형</div>
            <div className="donut-chart-row-wrap">
              <div className="donut-chart-wrap">
                <div className="chart-inner-wrap">
                  <div className="chart-name">성별</div>
                  <Chart
                    options={donutOptions1}
                    series={donutSeries1}
                    type="donut"
                    height="200px"
                    css={css`
                      width: 100%;
                    `}
                  />
                </div>
                { stats && (stats.rate_fan_women && stats.rate_fan_men) ? (
                  <div className="label-row-wrap">
                    <div css={chartLabelWrap(donutColor1[0])}>
                      <i/>
                      <span className="label">남성 {rate_fan_men}%</span>
                    </div>
                    <div css={chartLabelWrap(donutColor1[1])}>
                      <i/>
                      <span className="label">여성 {rate_fan_women}%</span>
                    </div>
                  </div>
                ) : (
                  <h1 css={css`font-weight:bold;`}>준비중입니다.</h1>
                )}
              </div>
              <div className="donut-chart-wrap">
                <div className="chart-inner-wrap">
                  <div className="chart-name">팬 지역분포</div>
                  <Chart
                    options={donutOptions2}
                    series={donutSeries2}
                    type="donut"
                    height="200px"
                    css={css`
                      width: 100%;
                    `}
                  />
                </div>
                {fanprovince ? (
                  <div className="label-row-wrap">
                    {List_province.map((place, i) => (
                        <div css={chartLabelWrap(donutColor2[i])}>
                          <i/>
                          <span className="label">{place} {rate_fan_province[i]}%</span>
                        </div>
                    ))}
                  </div>
                ) : (
                 <h1 css={css`font-weight:bold;`}>준비중입니다.</h1>
                )}
              </div>
              <div className="donut-chart-wrap">
                <div className="chart-inner-wrap">
                  <div className="chart-name">팬의 연령</div>
                  <Chart
                    options={donutOptions3}
                    series={donutSeries3}
                    type="donut"
                    height="200px"
                    css={css`
                      width: 100%;
                    `}
                  />
                </div>
                {stats && (stats.rate_fan_women && stats.rate_fan_men) ? (
                  <div className="label-row-wrap">
                    {ages.map((age, i) => (
                        <div css={chartLabelWrap(donutColor3[i])}>
                          <i/>
                          <span className="label">{age} {rate_fan_ages[i]}%</span>
                        </div>
                    ))}
                  </div>
                ) : (
                  <h1 css={css`font-weight: bold;`}>준비중입니다.</h1>
                )}
              </div>
            </div>
          </div>
        }
      </div>

<div className="live">
   <div className="title"> 라이브 지수 <a onClick={()=>{숨기기1(!보이기1)}} >더보기</a></div>
  <div className="livedata">

<div className="chart-wrap1">
          <div className="title1">라이브 수(최근 30일)</div>
          <div className="title2">85</div>
 </div>

  <div className="chart-wrap1">
          <div className="title1">누적 시청자 수(최근 30일) </div>
          <div className="title2">4.81억</div>
 </div>

    <div className="chart-wrap1">
          <div className="title1">라이브 상품 매출(최근 30일) </div>
          <div className="title2">5271.95만</div>
 </div>

    <div className="chart-wrap1">
          <div className="title1">평균 좋아요 수 (최근 30일)</div>
          <div className="title2">309.22만</div>
 </div>
</div>

       {
     보이기1===true?<Morelivedata />:null
     }

 <div className="live-graph">
          <div className="title1">라이브 시청자 수/매출 (최근 10번)

           <div className="point-wrap1">
            <div className="point1" >
              <i />
              시청자 수
            </div>
            <div className="point2" >
              <i />
              매출
            </div>
          </div>

          </div>


           <div className="line-chart-wrap">
              <Chart
                  options={lineOptions1}
                  series={
                    !is_month ? [{name: '주간 팬수', data: fansOverallFansNumList,},]
                        : [{name: '월간 팬수', data: fansOverallFansNumList,},]
                  }
                  type="bar"
                  height='302'
                  css={css`
                    width: 100%;
                  `}
              />
            </div>
 </div>


 </div>




      <div css={campaignWrap}>
        <div className="title">캠페인</div>
        <div className="index">총 {campaignTotal}개 캠페인 중 {(campaignPage*campaign_list_size)+1}~{(campaignPage+1)*campaign_list_size}번째</div>
        <div className="campaignCardWrap">
          {/*
            // TODO James 캠페인 데이터가 축적시 변경
            campaignData?.[campaignPage] &&
          // @ts-ignore
            (campaignData[campaignPage] || []).map((props, i) => (
              <CampaignCard2
                key={(props.id && props.id + i) || i}
                isStars={true}
                {...props}
              />
            ))*/}
          {post?.[0] ?
              (// @ts-ignore
            post.map((props ) => (
              <CampaignCard2
                user_thumbnail_url={props.influencer_sns_profile_id.original_thumbnail_url}
                original_url={
                  props.InfluencerSnsPostContents_post_id?.[0] ?
                    props.InfluencerSnsPostContents_post_id[0].original_url :
                    props.influencer_sns_profile_id.original_thumbnail_url
                }
                user_nickname={props.influencer_sns_profile_id.nickname}
                categories={[props.influencer_sns_profile_id.category_id]}
                keywords={props.keyword ? props.keyword.split(',') : []}
                isStars={true}
                {...props}
                post_url = {
                  setPostUrl(
                    props.post_id,
                    props.influencer_sns_profile_id.sns_platform_id.post_path,
                    profile.sns_id
                  )
                }
                influencer_engage_rate={stats ? stats.engage_rate_2 : undefined}
                post_engage_rate={props.engage_rate}
                date_posted={props.date_posted}
                sns_platform_id_id={props.influencer_sns_profile_id.sns_platform_id.id}
              />
              ))) : (
                <h1 css={css`margin-left: 2.3rem; font-weight:bold;`}>COMING SOON</h1>
              )}
        </div>





        <PageButton
          page={campaignPage}
          setPage={setCampaignPage}
          page_limit={page_limit}
          last_page={campaign_last_page}
        />
      </div>
      <div css={influenceWrap}>
        <div className="title">인플루언서</div>
        <div className="column-wrap">
          {profile.sns_platform_id.id !== snsplatform.douyin ? (
            <>
              {/*
          <div className="inner-wrap" css={estimatedSales}>
            <div className="title">
              <span>예상매출액</span>
              <i data-tip data-for="estimated-sales">
                <SVGIcon name={"question"}/>
              </i>
              <ReactTooltip
                  id="estimated-sales"
                  place={"right"}
                  type={"dark"}
                  effect={"solid"}
                  multiline={true}
                  className={"custom-tooltip"}
              >
                <span>예상매출액이란...</span>
              </ReactTooltip>
            </div>
            <div className="content-wrap">
              <div className="estimated-text-wrap">
                <div className="estimated-average">
                  {((minEstimatedSales + maxEstimatedSales) / 2).toLocaleString()}위안화
                </div>
                <div className="estimated-min-max-wrap">
                  <div className="estimated-min-wrap">
                    <label>최소 예상 매출액</label>
                    <span>
                      {minEstimatedSales.toLocaleString()}위안화
                    </span>
                  </div>
                  <div className="estimated-tilde-wrap">~</div>
                  <div className="estimated-max-wrap">
                    <label>최대 예상 매출액</label>
                    <span>
                      {maxEstimatedSales.toLocaleString()}위안화
                    </span>
                  </div>
                </div>
              </div>
              <div
                css={gageWrap(
                  minEstimatedSales,
                  maxEstimatedSales,
                  (minEstimatedSales + maxEstimatedSales) / 2,
                  15000000
                )}
              >
                <div className="gage-bar">
                  <div className="gage">
                    <div className="point" />
                  </div>
                </div>
                <div className="gage-points">
                  <span>0</span>
                  <span>375만</span>
                  <span>750만</span>
                  <span>1125만</span>
                  <span>1500만</span>
                </div>
              </div>
            </div>
          </div>
          */}
              <div className="inner-wrap" css={estimatesWrap}>
                <div className="title">
                  <span>예상견적</span>
                  <i data-tip data-for="estimates">
                    <SVGIcon name={"question"}/>
                  </i>
                  <ReactTooltip
                    id="estimates"
                    place={"right"}
                    type={"dark"}
                    effect={"solid"}
                    multiline={true}
                    className={"custom-tooltip"}
                  >
                <span>
                  인플루언서가 게시글 업로드시 예상 견적을 보여줍니다.
                </span>
                  </ReactTooltip>
                </div>
                <div className="content-wrap">
                  <div className="left-wrap">
                    <div className="icon-n-cost-wrap">
                      <div className="icon-wrap">
                        <SVGIcon name={"mic_ic"}/>
                      </div>
                      <div className="cost-wrap">
                        {/* TODO 차후 수정 */}
                        {/*<label>협찬/노출 포스트 비용</label>*/}
                        <label>비디오 게시글 가격</label>
                        <span>
                      {profile.video_post_price.toLocaleString()}위안화
                    </span>
                      </div>
                    </div>
                    <div
                      css={gageWrap(
                        profile.video_post_price / 2,
                        profile.video_post_price,
                        (profile.video_post_price) / 2,
                        total_size_sponsorshipExposurePostCostt * 10000
                      )}
                    >
                      <div className="gage-bar">
                        <div className="gage">
                          <div className="point"/>
                        </div>
                      </div>
                      <div className="gage-points">
                        <span>0</span>
                        <span>{total_size_sponsorshipExposurePostCostt * 0.25}만</span>
                        <span>{total_size_sponsorshipExposurePostCostt * 0.5}만</span>
                        <span>{total_size_sponsorshipExposurePostCostt * 0.75}만</span>
                        <span>{total_size_sponsorshipExposurePostCostt}만</span>
                      </div>
                    </div>
                  </div>
                  <div className="right-wrap">
                    <div className="icon-n-cost-wrap">
                      <div className="icon-wrap">
                        <SVGIcon name={"shopping_bag_ic"}/>
                      </div>
                      <div className="cost-wrap">
                        {/* TODO 차후 수정 */}
                        {/*<label>판매 포스트 비용</label>*/}
                        <label>사진 게시글 가격</label>
                        <span>{profile.normal_post_price.toLocaleString()}위안화</span>
                      </div>
                    </div>
                    <div
                      css={gageWrap(
                        (profile.normal_post_price) / 2,
                        profile.normal_post_price,
                        (profile.normal_post_price) / 2,
                        total_size_salesPostCost * 10000
                      )}
                    >
                      <div className="gage-bar">
                        <div className="gage">
                          <div className="point"/>
                        </div>
                      </div>
                      <div className="gage-points">
                        <span>0</span>
                        <span>{total_size_salesPostCost * 0.25}만</span>
                        <span>{total_size_salesPostCost * 0.5}만</span>
                        <span>{total_size_salesPostCost * 0.75}만</span>
                        <span>{total_size_salesPostCost}만</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row-wrap">
                <div className="inner-wrap" css={brandWrap}>
                  <div className="title">
                    <span>브랜드</span>
                    <i data-tip data-for="brand">
                      <SVGIcon name={"question"}/>
                    </i>
                    <ReactTooltip
                      id="brand"
                      place={"right"}
                      type={"dark"}
                      effect={"solid"}
                      multiline={true}
                      className={"custom-tooltip"}
                    >
                  <span>
                    인플루언서가 캠페인을 진행한<br/>
                    브랜드별 횟수를 보여줍니다.
                  </span>
                    </ReactTooltip>
                  </div>
                  <div className="index">
                    총 {brandTotal}개 콜라보 브랜드 중 {
                    (brandPage * brand_list_size) + 1}~{(brandPage + 1) * brand_list_size}번째
                  </div>
                  <div className="content-wrap">
                    <div className="brands-wrap">
                      {/*
                      brandsData?.[brandPage] &&
                        // @ts-ignore
                        (brandsData[brandPage] || []).map((props, i) => (
                          <div className="brand" key={i}>
                            <div className="logo-wrap">
                              <img src={props.logoUrl} alt="" />
                            </div>
                            <div className="brand-name">{props.name}</div>
                            <div className="brand-post-count">{props.count}회</div>
                          </div>
                      ))*/}
                      {brandsData?.[0] ?
                        // @ts-ignore
                        (brandsData.map((brand, i) => (
                          <div className="brand" key={i}>
                            {/*
                          <div className="logo-wrap">
                            <img src={props.logoUrl} alt="Brand Logo that collaboration with influencer"/>
                          </div>
                        */}
                            <div className="brand-name">{brand.collabo_brand_name}</div>
                            <div className="brand-post-count">{brand.count}회</div>
                          </div>
                        ))) : (
                          <h1 css={css`margin-left: 2.3rem; font-weight:bold;`}>COMING SOON</h1>
                        )}
                    </div>
                    <div css={css`margin-bottom: -3.8rem; ${media.small} {margin: -3.8rem 0 -2.4rem;}`}>
                      <PageButton
                        page={brandPage}
                        setPage={setBrandPage}
                        page_limit={page_limit}
                        last_page={brandLastPage}
                      />
                    </div>
                  </div>
                </div>
                <CountKeyword
                  user={user}
                  id={Number(id)}
                  header={header}
                  page_limit={page_limit}
                />
              </div>
            </>
          ):(
            <CountKeyword
              user={user}
              id={Number(id)}
              header={header}
              page_limit={page_limit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const wanghongDetail = css`
  flex: 1;
  padding: 6.4rem 3.7rem 9.8rem;
  max-width: 111rem;
  box-sizing: content-box;
  ${media.small} {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    margin-bottom: 9.3rem;
  }
`;

const wanghongInfoWrap = (audience: number, wished: boolean) => css`
  display: flex;
  flex-direction: column;
  //gap: 3rem;
  margin-bottom: 3rem;
  > .top-wrap {
    display: flex;
    //gap: 3rem;
    margin-bottom: 3rem;
    > .left-wrap {
      margin-right: 3rem;
      display: flex;
      flex-direction: column;
      width: 82.5rem;
      border-radius: 16px;
      box-shadow: 0 3px 8px -1px rgba(50, 50, 71, 0.05),
        0 0 1px 0 rgba(12, 26, 75, 0.24);
      background-color: #ffffff;
      > .top {
        position: relative;
        display: flex;
        border-bottom: 1px solid #eeedf0;
        .wish-button {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 11.1rem;
          height: 4.8rem;
          top: 3.2rem;
          right: 4rem;
          background-color: ${wished ? "#ffa5ba" : palette.white};
          border: 1px solid #ffa5ba;
          color: ${wished ? palette.white : "#ffa5ba"};
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.4rem;
          line-height: 1;
          font-weight: bold;
          svg {
            margin-right: 0.8rem;
          }
        }
        .img-wrap {
          padding: 3.2rem 4rem 5.2rem;
        }
        .main-info-wrap {
          display: flex;
          flex-direction: column;
          justify-content: center;
          .id {
            font-size: 2.8rem;
            font-weight: bold;
            line-height: 1;
            color: #1b1d21;
            margin-bottom: 1.6rem;
          }
          .counts-wrap {
            display: flex;
            //gap: 3.2rem;
            margin-bottom: 2.4rem;
            .count-group {
              display: flex;
              margin-right: 2.4rem;
              .count-wrap {
                &:not(:first-of-type) {
                  margin-left: 2.4rem;
                }
                label {
                  font-size: 1.3rem;
                  font-weight: bold;
                  line-height: 1;
                  color: #718096;
                  margin-right: 0.8rem;
                }
                span {
                  font-size: 1.6rem;
                  font-weight: bold;
                  line-height: 1;
                  color: #1b1d21;
                }
              }
            }
          }
        }
      }
      > .bottom {
        display: flex;
        justify-content: space-between;
        padding: 2.4rem 4rem 3.4rem;
        .info-wrap {
          display: flex;
          flex-direction: column;
          max-width: 34.4rem;
          //gap: 1.4rem;
          label {
            margin-bottom: 1.4rem;
            font-size: 1.3rem;
            font-weight: bold;
            line-height: 1;
            color: #718096;
          }
          span {
            font-size: 1.4rem;
            line-height: 1;
            color: #1b1d21;
          }
        }
      }
    }
    > .right-wrap {
      display: flex;
      flex-direction: column;
      //gap: 3rem;
      .rank {
        margin-bottom: 3rem;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 25.5rem;
        height: 12.5rem;
        border-radius: 16px;
        box-shadow: 0 3px 8px -1px rgba(50, 50, 71, 0.05),
          0 0 1px 0 rgba(12, 26, 75, 0.24);
        background-color: #a0d7e7;
        box-sizing: content-box;
        label {
          position: absolute;
          top: 2.4rem;
          left: 2.4rem;
          font-size: 1.3rem;
          font-weight: bold;
          line-height: 1;
          color: #e8f3f4;
        }
        .content-wrap {
          display: flex;
          flex-direction: column;
          text-align: center;
          & > .content {
            margin-bottom: 0.5rem;
            font-size: 3.2rem;
            font-weight: bold;
            line-height: 1;
            color: #ffffff;
          }
          .sub-content {
            font-size: 1.3rem;
            font-weight: bold;
            line-height: 1;
            color: #fff6a6;
          }
        }
      }
      .audience {
        display: flex;
        flex-direction: column;
        width: 25.5rem;
        height: 13rem;
        padding: 2.4rem 2.4rem 1.2rem;
        border-radius: 16px;
        box-shadow: 0 3px 8px -1px rgba(50, 50, 71, 0.05),
          0 0 1px 0 rgba(12, 26, 75, 0.24);
        background-color: #ffffff;
        box-sizing: border-box;
        label {
          margin-bottom: 2.6rem;
          font-size: 1.3rem;
          font-weight: bold;
          line-height: 1;
          color: #718096;
        }
        .audience-wrap {
          display: flex;
          //gap: 1.6rem;
          svg {
            margin-right: 1.6rem;
          }
          .progress-wrap {
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex: 1;
            .progress-text {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1.35rem;
              span {
                &:nth-of-type(1) {
                  font-size: 1.3rem;
                  font-weight: 500;
                  line-height: 1;
                  color: #1b1d21;
                }
                &:nth-of-type(2) {
                  font-size: 1.3rem;
                  font-weight: bold;
                  line-height: 1;
                  color: #ffa5ba;
                }
              }
            }
            .progress-bar {
              width: 100%;
              height: 0.8rem;
              border-radius: 4px;
              background-color: #e9ecef;
              .progress {
                background-color: #ff92ae;
                border-radius: 4px;
                width: ${audience}%;
                height: 100%;
              }
            }
          }
        }
      }
    }
  }
  > .bottom-wrap {
    display: flex;
    //gap: 3rem;
    & > div {
      &:not(:first-of-type) {
        margin-left: 3rem;
      }
    }
  }
  ${media.small} {
    //gap: 1.6rem;
    width: 100%;
    margin-bottom: 1.5rem;
    > .top-wrap {
      flex-direction: column;
      align-items: center;
      padding-top: 1.5rem;
      margin: 0 1.5rem 1.6rem;
      > .left-wrap {
        width: 100%;
        margin-right: 0;
        margin-bottom: 1.9rem;
        > .top {
          flex-direction: column;
          align-items: center;
          padding-bottom: 1.6rem;
          .wish-button {
            top: 2.4rem;
            right: 2.33rem;
            width: auto;
            height: auto;
            background-color: inherit;
            border: none;
            svg {
              margin-right: 0;
              path {
                fill: ${wished ? palette.primary.normal : "#E4E4E4"};
              }
            }
          }
          .img-wrap {
            padding: 4rem 0 2.4rem !important;
          }
          .main-info-wrap {
            .id {
              text-align: center;
              font-size: 1.6rem;
              margin-bottom: 0.8rem;
            }
            .channel {
              text-align: center;
              font-size: 1.4rem;
              color: rgb(164, 165, 166);
              margin-bottom: 2.4rem;
            }
            .counts-wrap {
              display: flex;
              flex-direction: column;
              .count-group {
                margin-right: 0;
                margin-bottom: 1.3rem;
                .count-wrap {
                  display: flex;
                  flex-direction: column;
                  //gap: 1.3rem;
                  align-items: center;
                  label {
                    margin-right: 0;
                    margin-bottom: 1.3rem;
                  }
                }
              }
            }
          }
        }
        > .bottom {
          padding: 3.2rem 3rem 4.2rem;
          flex-direction: column;
          //gap: 3.9rem;
          & > div {
            &:not(:first-of-type) {
              margin-top: 3.9rem;
            }
          }
          .mobile-info-wrap {
            display: flex;
            justify-content: space-between;
          }
          .info-wrap {
            display: flex;
            flex-direction: column;
          }
        }
      }
      > .right-wrap {
        width: 100%;
        margin: 0 1.5rem;
        //gap: 1.6rem;
        .rank {
          margin-bottom: 1.6rem;
          width: 100%;
          height: 15.5rem;
          .content-wrap {
            .content {
              margin-bottom: 1.5rem;
            }
          }
        }
        .audience {
          width: 100%;
          height: 13.2rem;
          label {
            margin-bottom: 2.4rem;
          }
        }
      }
    }
    > .bottom-wrap {
      flex-direction: column;
      align-items: center;
      //gap: 1.6rem;
      margin: 0 1.5rem;
      & > div {
        &:not(:first-of-type) {
          margin-left: 0;
          margin-top: 1.6rem;
        }
      }
    }
  }
`;

const reactionChartWrap = css`
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 3px 8px -1px rgba(50, 50, 71, 0.05),
    0 0 1px 0 rgba(12, 26, 75, 0.24);
  background-color: #ffffff;
  padding: 3.2rem;
  margin-bottom: 6.4rem;
  & > .title {
    font-size: 2.4rem;
    font-weight: bold;
    line-height: 1;
    color: #1b1d21;
    padding-bottom: 2.4rem;
    margin-bottom: 3.9rem;
    border-bottom: 1px solid #eeedf0;
  }
  .chart-wrap + .chart-wrap {
    margin-top: 7.3rem;
  }
  & > .chart-wrap {
    position: relative;
    .point-wrap {
      position: absolute;
      display: flex;
      //gap: 2.4rem;
      top: 0.8rem;
      right: 5.2rem;
      .point {
        &:not(:first-of-type) {
          margin-left: 2.4rem;
        }
        display: flex;
        align-items: center;
        font-size: 1.2rem;
        color: #1b1d21;
        i {
          display: inline-block;
          width: 0.8rem;
          height: 0.8rem;
          border-radius: 50%;
          margin-right: 0.8rem;
        }
        &:nth-of-type(1) {
          i {
            background-color: #dfe4e9;
          }
        }
        &:nth-of-type(2) {
          i {
            background-color: #ffa5ba;
          }
        }
      }
    }
    .sort-selected-wrap {
      position: absolute;
      display: flex;
      top: 0.8rem;
      right: 5.2rem;
      .sort-selected { 
        &:not(:first-of-type) {
          margin-left: 2.4rem;
        }
        display: flex;
        button {
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 12px;
          width: 9rem;
          height: 4.8rem;
          cursor: pointer;
          font-size: 1.4rem;
          font-weight: bold;
        }
        &:nth-of-type(1) {
          button {
            &.active {
              background-color: #dba8ec;
              color: #fff;
            }
          }
        }
        &:nth-of-type(2) {
          button {
            &.active {
              background-color: #a0d7e7;
              color: #fff;
            }
          }
        }
      }
    }
    & > .title {
      font-size: 1.8rem;
      font-weight: bold;
      line-height: 1;
      color: #1b1d21;
      margin-bottom: 2.6rem;
    }
    .bar-chart-wrap {
      display: flex;
      justify-content: center;
      height: 31.2rem;
      .bar-chart{
        display: flex;
        flex-direction: column;
        width: 40%;
        .bar-chart-title {
          font-size: 1.8rem;
          font-weight: bold;
          align-self: center;
        }
      }
    }
    .line-chart-wrap {
      display: flex;
      justify-content: center;
      height: 31.2rem;
    }
    .donut-chart-row-wrap {
      display: flex;
      justify-content: center;
      //gap: 12rem;
      margin-bottom: 4.5rem;
      .donut-chart-wrap {
        &:not(:first-of-type) {
          margin-left: 12rem;
        }
        display: flex;
        flex-direction: column;
        align-items: center;
        //gap: 1rem;
        .chart-inner-wrap {
          position: relative;
          margin-bottom: 1rem;
          .chart-name {
            position: absolute;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 18rem;
            font-size: 1.8rem;
            font-weight: bold;
          }
        }
        .label-row-wrap {
          display: flex;
          //gap: 1.6rem 2.4rem;
          flex-flow: row wrap;
          justify-content: center;
          max-width: 25rem;
          ${gapPolyfill({ top: 1.6, left: 2.4 })};
        }
      }
    }
  }
  ${media.small} {
    width: calc(100% - 3rem);
    margin: 0 1.5rem 4.8rem;
    .chart-wrap + .chart-wrap {
      margin-top: 6.4rem;
    }
    .chart-wrap {
      .title {
        margin-bottom: 1.8rem;
      }
      .point-wrap {
        position: unset;
        margin-bottom: 3.2rem;
      }
      .bar-chart-wrap {
        display: flex;
        flex-direction: column;
        height: unset;
        .bar-chart {
          width: 100%;
        }
      }
      .sort-selected-wrap {
        position: static;
        display: flex;
        justify-content: flex-end;
        .sort-selected {
          button {
            width: 9rem;
            height: 4.2rem;
          }
        }
      }
      .donut-chart-row-wrap {
        flex-direction: column;
        //gap: 6.4rem;
        margin-bottom: 2rem;
        .donut-chart-wrap {
          &:not(:first-of-type) {
            margin-left: 0;
            margin-top: 6.4rem;
          }
        }
      }
    }
  }
`;

const chartLabelWrap = (markColor: string) => css`
  display: flex;
  //gap: 0.8rem;
  align-items: center;
  i {
    display: inline-block;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background-color: ${markColor};
    margin-right: 0.8rem;
  }
  span {
    font-size: 1.2rem;
  }
`;

const subInfoCard = (isBadge: boolean) => css`
  width: 25.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2.4rem;
  border-radius: 16px;
  box-shadow: 0 3px 8px -1px rgba(50, 50, 71, 0.05),
    0 0 1px 0 rgba(12, 26, 75, 0.24);
  background-color: #ffffff;
  label {
    font-size: 1.3rem;
    font-weight: bold;
    line-height: 1;
    color: #718096;
    margin-bottom: 1rem;
  }
  & > .content {
    display: flex;
    align-items: center;
    justify-content: ${isBadge ? "space-between" : "flex-end"};
    span {
      font-size: 2rem;
      font-weight: bold;
      line-height: 1;
      color: #16192c;
    }
  }
  ${media.small} {
    width: 100%;
    label {
      margin-bottom: 1.6rem;
    }
  }
`;

const categoriesWrap = css`
  display: flex;
  //gap: 0.8rem;
  ${gapPolyfill({ top: 0.8, left: 0.8 })};
  flex-flow: row wrap;
  div {
    background-color: ${palette.gray[200]};
    padding: 0.6rem 1rem;
    border-radius: 6px;
    font-size: 1.2rem;
    font-weight: 500;
    line-height: 1;
    color: ${palette.grayBlue};
  }
  ${media.medium} {
    max-width: 30.2rem;
  }
  ${media.small} {
    justify-content: center;
    max-height: unset;
    height: 5.6rem;
    div {
      height: 2.4rem;
      box-sizing: border-box;
    }
  }
`;

const getBadgeColor = (value: string) => {
  switch (value) {
    case "good":
      return "#377dff";
    case "notBad":
      return "#38cb89";
    case "bad":
      return "#ff5630";
  }
};

const getBadgeBGColor = (value: string) => {
  switch (value) {
    case "good":
      return "#ebf2ff";
    case "notBad":
      return "#e5f6ef";
    case "bad":
      return "#ffefeb";
  }
};

const badge = (state: string) => css`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 15px;
  width: 7.2rem;
  height: 2.6rem;
  font-size: 1.2rem;
  font-weight: 500;
  color: ${getBadgeColor(state)};
  background-color: ${getBadgeBGColor(state)};
`;

const campaignWrap = css`
  position: relative;
  display: flex;
  flex-direction: column;
  & > .title {
    font-size: 2.8rem;
    font-weight: bold;
    color: #16192c;
    margin-bottom: 4.2rem;
  }
  & > .index {
    position: absolute;
    top: 1.6rem;
    right: 0;
    font-size: 1.4rem;
    font-weight: bold;
  }
  .campaignCardWrap {
    display: flex;
    flex-direction: column;
    //gap: 3rem;
    & > div {
      &:not(:first-of-type) {
        margin-top: 3rem;
      }
    }
  }
  ${media.small} {
    width: calc(100% - 3rem);
    margin: 0 1.5rem;
    .title {
      margin-bottom: 3.2rem;
    }
    .index {
      position: absolute;
      top: 4.2rem;
    }
    .campaignCardWrap {
      margin-top: 2.2rem;
    }
  }
`;

const influenceWrap = css`
  display: flex;
  flex-direction: column;
  padding: 3.2rem 3.2rem 4rem;
  border-radius: 16px;
  box-shadow: 0 3px 8px -1px rgba(50, 50, 71, 0.05),
    0 0 1px 0 rgba(12, 26, 75, 0.24);
  background-color: #ffffff;
  & > .title {
    font-size: 2.4rem;
    line-height: 1;
    font-weight: bold;
    color: #1b1d21;
    margin-bottom: 3.2rem;
  }
  & > .column-wrap {
    display: flex;
    flex-direction: column;
    //gap: 3rem;
    & > div {
      &:not(:first-of-type) {
        margin-top: 3rem;
      }
    }
    .row-wrap {
      display: flex;
      //gap: 3rem;
      .inner-wrap {
        &:first-of-type {
          margin-right: 3rem;
        }
        flex: 1;
      }
    }
    .inner-wrap {
      padding: 3.2rem;
      border-radius: 16px;
      border: solid 1px #eeedf0;
      background-color: #ffffff;
      & > .title {
        display: flex;
        align-items: center;
        span {
          font-size: 1.8rem;
          font-weight: bold;
          line-height: 1;
          color: #1b1d21;
        }
        margin-bottom: 4.8rem;
        i {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: 1.2rem;
          width: 2.4rem;
          height: 2.4rem;
          border: 1px solid #eeedf0;
          border-radius: 8px;
          cursor: pointer;
          svg {
            width: 1.6rem;
            height: 1.6rem;
          }
        }
      }
    }
  }
  .custom-tooltip {
    background-color: #1b1d21 !important;
    border-radius: 8px !important;
    padding: 1rem 1rem 1rem 1.2rem !important;
    opacity: 1 !important;
    span {
      font-size: 1.2rem !important;
      font-weight: 500;
      color: #fff !important;
    }
  }
  ${media.small} {
    width: calc(100% - 3rem);
    margin: 0 1.5rem;
    .column-wrap {
      //gap: 1.6rem;
      & > div {
        &:not(:first-of-type) {
          margin-top: 1.6rem;
        }
      }
      .row-wrap {
        flex-direction: column;
        //gap: 1.6rem;
        & > div {
          &:first-of-type {
            margin-right: 0 !important;
            margin-bottom: 1.6rem;
          }
        }
      }
      .inner-wrap {
        > .title {
          margin-bottom: 2.9rem;
        }
        > .content-wrap {
          padding: 0;
          .estimated-text-wrap {
            flex-direction: column;
            //gap: 2.4rem;
            //margin-bottom: 0;
            margin-bottom: 3.2rem;
            .estimated-average {
              font-size: 3.2rem;
              margin-bottom: 2.4rem;
            }
          }
          .estimated-min-max-wrap {
            flex-flow: row wrap;
            //gap: 2.3rem 0;
            ${gapPolyfill({ top: 2.3 })};
          }
        }
      }
    }
  }
`;

const estimatedSales = css`
  .content-wrap {
    display: flex;
    flex-direction: column;
    //gap: 4.8rem;
    padding: 0 3.2rem;
    .estimated-text-wrap {
      display: flex;
      //gap: 6.3rem;
      margin-bottom: 4.8rem;
      .estimated-average {
        margin-right: 6.3rem;
        font-size: 5.6rem;
        font-weight: bold;
        line-height: 1;
        color: #ffa5ba;
      }
      .estimated-min-max-wrap {
        display: flex;
        align-items: center;
        .estimated-tilde-wrap {
          font-size: 2.4rem;
          font-weight: bold;
          line-height: 1;
          color: #1b1d21;
          margin: 0 1.4rem 0.6rem;
          align-self: flex-end;
        }
        .estimated-min-wrap,
        .estimated-max-wrap {
          display: flex;
          flex-direction: column;
          //gap: 1rem;
          label {
            margin-bottom: 1rem;
            font-size: 1.3rem;
            font-weight: bold;
            line-height: 1;
            color: #718096;
          }
          span {
            font-size: 2.4rem;
            font-weight: bold;
            line-height: 1;
            color: #1b1d21;
          }
        }
      }
    }
  }
  ${media.small} {
    padding: 3.2rem 3.2rem 4.62rem !important;
    .content-wrap {
      .estimated-text-wrap {
        .estimated-average {
          margin-right: 0;
        }
        .estimated-min-max-wrap {
          .estimated-tilde-wrap {
            margin-bottom: 0;
          }
        }
      }
    }
  }
`;

const gageWrap = (
  min: number,
  max: number,
  average: number,
  totalSize: number
) => css`
  display: flex;
  flex-direction: column;
  //gap: 2.4rem;
  margin-bottom: 3.2rem;
  .gage-bar {
    position: relative;
    width: 100%;
    height: 2.4rem;
    margin-bottom: 2.4rem;
    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: calc(50% - 0.3rem);
      border-radius: 3px;
      height: 0.6rem;
      width: 100%;
      background-color: #edf2f7;
    }
    .gage {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      left: ${(min / totalSize) * 100}%;
      top: 0;
      height: 100%;
      width: ${(average / totalSize) * 100}%;
      border-radius: 12px;
      background-color: #a0d7e7;
      .point {
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 50%;
        background-color: #ffa5ba;
      }
    }
  }
  .gage-points {
    display: flex;
    justify-content: space-between;
    span {
      font-size: 1.5rem;
      line-height: 1;
      color: #1b1d21;
    }
  }
  ${media.small} {
    margin-bottom: 0;
    .gage-bar {
      height: 1.2rem;
      .gage {
        .point {
          width: 0.8rem;
          height: 0.8rem;
        }
      }
    }
  }
`;

const estimatesWrap = css`
  .content-wrap {
    display: flex;
    //gap: 7.6rem;
    padding: 0 3.2rem;
    .left-wrap {
      margin-right: 7.6rem;
    }
    .right-wrap,
    .left-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      .icon-n-cost-wrap {
        display: flex;
        align-items: center;
        margin-bottom: 4.8rem;
        .icon-wrap {
          width: 4.8rem;
          height: 4.8rem;
          padding: 1.2rem;
          border-radius: 16px;
          background-color: #eeedf0;
          margin-right: 2.4rem;
          box-sizing: border-box;
          i {
            display: inline-block;
            width: 2.4rem;
            height: 2.4rem;
            background-color: ${palette.sky};
          }
        }
        .cost-wrap {
          display: flex;
          flex-direction: column;
          justify-content: center;
          //gap: 1rem;
          label {
            margin-bottom: 1rem;
            font-size: 1.3rem;
            font-weight: bold;
            line-height: 1;
            color: #718096;
          }
          span {
            font-size: 2.4rem;
            font-weight: bold;
            line-height: 1;
            color: #1b1d21;
          }
        }
      }
    }
  }
  ${media.small} {
    padding: 3.2rem 3.2rem 4.62rem !important;
    > .title {
      margin-bottom: 3.2rem !important;
    }
    .content-wrap {
      flex-direction: column;
      //gap: 4.82rem;
      .left-wrap {
        margin-right: 0;
        margin-bottom: 4.82rem;
        .icon-n-cost-wrap {
          margin-bottom: 3.3rem;
        }
      }
    }
  }
`;

const brandWrap = css`
  position: relative;
  min-width: 51rem;
  box-sizing: border-box;
  .title {
    margin-bottom: 4rem;
  }
  .index {
    position: absolute;
    top: 3.5rem;
    right: 3.2rem;
    font-size: 1.2rem;
    font-weight: 500;
  }
  .content-wrap {
    display: flex;
    flex-direction: column;
    .brands-wrap {
      display: flex;
      flex-direction: column;
      //gap: 1.9rem;
      margin-bottom: 0.5rem;
      .brand{
        &:not(:first-of-type) {
          margin-top: 1.9rem;
        }
        display: flex;
        justify-content: space-between;
        padding-bottom: 2.3rem;
        border-bottom: 1px solid #eeedf0;
        .logo-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 14rem;
          height: 7.2rem;
          border-radius: 16px;
          border: solid 1px #eeedf0;
          margin-bottom: 1.6rem;
          img {
            object-fit: cover;
            width: 80%;
            height: 3rem;
          }
        }
        .brand-name {
          font-size: 1.6rem;
          font-weight: bold;
          line-height: 1;
          text-align: center;
          color: #ffa5ba;
          margin: 0.6rem 0 0 0.1rem;
        }
        .brand-post-count {
          font-size: 1.4rem;
          font-weight: bold;
          line-height: 1;
          text-align: center;
          color: #000000;
        }
      }
    }
  }
  ${media.small} {
    min-width: unset;
    padding-bottom: 0 !important;
    .index {
      position: absolute;
      top: 8rem;
      right: 3.2rem;
    }
    .content-wrap {
      margin-top: 8.2rem;
      .brands-wrap {
        //gap: 2.4rem 1.8rem;
        ${gapPolyfill({ top: 2.4, left: 1.8 })};
        padding-bottom: 3.5rem;
        justify-content: center;
        .logo-wrap {
          width: 9.9rem;
          height: 5.1rem;
          margin-bottom: 1.7rem;
        }
      }
    }
  }
`;

const hashTagWrap = css`
  position: relative;
  min-width: 51rem;
  box-sizing: border-box;
  .title {
    margin-bottom: 4rem;
  }
  .index {
    position: absolute;
    top: 3.5rem;
    right: 3.2rem;
    font-size: 1.2rem;
    font-weight: 500;
  }
  .content-wrap {
    display: flex;
    flex-direction: column;
    .hash-tag-wrap {
      display: flex;
      flex-direction: column;
      //gap: 1.9rem;
      margin-bottom: 0.5rem;
      .hash-tag {
        &:not(:first-of-type) {
          margin-top: 1.9rem;
        }
        display: flex;
        justify-content: space-between;
        padding-bottom: 2.3rem;
        border-bottom: 1px solid #eeedf0;
        .hash-tag-name {
          font-size: 1.6rem;
          font-weight: bold;
          line-height: 1;
          color: #ffa5ba;
          margin: 0.6rem 0 0 0.1rem;
        }
        .hash-tag-post-count {
          display: flex;
          //gap: 1.6rem;
          align-items: center;
          label {
            margin-right: 1.6rem;
            font-size: 1.4rem;
            line-height: 1;
            color: #000000;
          }
          span {
            font-size: 1.4rem;
            font-weight: bold;
            line-height: 1;
            color: #000000;
          }
        }
      }
    }
  }
  ${media.small} {
    min-width: unset;
    padding-bottom: 0 !important;
    .index {
      position: absolute;
      top: 8rem;
      right: 3.2rem;
    }
    .content-wrap {
      margin-top: 8.2rem;
    }
  }
`;

const paginationWrap = (
  isNoMarginBottom: boolean = false,
  isBrandOrHashTag: boolean = false
) => css`
  display: flex;
  justify-content: center;
  //gap: 0 0.8rem;
  margin: 3rem 0 6.4rem;
  margin-bottom: ${isNoMarginBottom && 0};
  button {
    &:not(:first-of-type) {
      margin-left: 0.8rem;
    }
    border-radius: 12px;
    background-color: #eeedf0;
    font-size: 1.4rem;
    line-height: 1;
    font-weight: bold;
    width: 7.4rem;
    height: 4.8rem;
    cursor: pointer;
    &.active {
      background-color: #1b1d21;
      color: #fff;
    }
  }
  ${media.small} {
    margin: ${isBrandOrHashTag ? "2.3rem 0 2.9rem" : "3rem 0 4.8rem"};
    button {
      width: 4.8rem;
      height: 4rem;
    }
  }
`;

const innerWrap = css`
  .custom-tooltip {
    background-color: #1b1d21 !important;
    border-radius: 8px !important;
    padding: 1rem 1rem 1rem 1.2rem !important;
    opacity: 1 !important;
    span {
      font-size: 1.2rem !important;
      font-weight: 500;
      color: #fff !important;
    }
  }
  i {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 1.2rem;
    width: 2.4rem;
    height: 2.4rem;
    border: 1px solid #eeedf0;
    border-radius: 8px;
    cursor: pointer;
    svg {
      width: 1.6rem;
      height: 1.6rem;
    }
  }
`
function Morelivedata(){

const donutColor1=["#a0d7e7","#ffd506"]
const donutSize='80%'
const donutOptions1:ApexOptions=DonutChartOption(donutColor1,donutSize);
const donutSeries1=[35,65];


  const donutOptions2: ApexOptions = DonutChartOption(donutColor1, donutSize)
  const donutOptions3: ApexOptions = DonutChartOption(donutColor1, donutSize)

  return(
      <>
        <div className='livefeatures'>
       2시간이상 초과의 라이브는  총 라이브 수의  65% 를 차지합니다 .  <br/>
 일요일에  라이브를 가장  많이  합니다.총 시간의  80% 차지합니다.<br/>
라이브를 가장  많이 하는 시간대는 새벽 (2:00~6:00)  입니다.  88% 의 방송을 이 시간에서 합니다
      </div>


<div className="livegraphs">
      <div className="livegraph">라이브시간길이
<div className="name1">65%</div>
        <div className="name2">{">"}2시간</div>

<Chart
options={donutOptions1}
series={donutSeries1}
type="donut"
height="200px"
css={css`
width:100%;
`}
/>
        <div>
           <div className="time">
             <div className="time1">
                    <div css={chartLabelWrap(donutColor1[1])}>
                      <i/>
                      <span className="label">{">"}2h</span>
                    </div>

               </div>
                    <div css={chartLabelWrap(donutColor1[0])}>
                      <i/>
                      <span className="label">{"<"}30m</span>
                    </div>
                  </div>
        </div>
       </div>






  <div className="livegraph">라이브시간(주간)

<Chart
options={donutOptions3}
series={[{
          data: [3, 2, 3, 2, 5, 8, 10]
        }]}
type="bar"
height="200px"
css={css`
width:100%;
`}
/>

</div>


    <div className="livegraph">라이브시간(주간)

<Chart
options={donutOptions1}
series={[{
    name: 'sales',
    data: ["5%","10%","0%","5%","0%","0%","10%", "70%"],
 }
  ]}
type="bar"
height="200px"
css={css`
width:100%;
`}
/>

</div>



</div>








<div className="more">
       더 많은 그래프 COMING SOON
</div>

        </>
  )
}

export default WanghongDetail;
