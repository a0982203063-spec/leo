/**
 * Vercel Serverless Function: 即時連線 591 店鋪抓取最新在售物件
 * 經紀人：黃書恩 (LEO) - 店鋪：broker45609
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600"); // 5分鐘快取，加速訪問

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const shopId = "45609";
  let allItems = [];
  let firstRow = 0;
  const totalRows = 50;

  try {
    while (true) {
      const url = `https://bff-house.591.com.tw/v2/web/shop/house/list?module=shop&action=house&respType=json&shop_id=${shopId}&type=2&device=pc&firstRow=${firstRow}&totalRows=${totalRows}`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "device": "pc"
        }
      });

      if (!response.ok) break;

      const json = await response.json();
      const items = json.data || [];

      if (items.length > 0) {
        allItems = allItems.concat(items);
        firstRow += items.length;
        if (items.length < 10) break;
      } else {
        break;
      }
    }

    const properties = [];
    let idx = 1;

    for (const item of allItems) {
      const sec = (item.sectionname || "").replace(/<[^>]+>/g, "").trim();
      const reg = (item.regionname || "").replace(/<[^>]+>/g, "").trim();

      let category = "nationwide";
      let categoryName = "全台精選";

      if (sec.includes("西屯")) {
        category = "xitun";
        categoryName = "西屯七期";
      } else if (sec.includes("南屯")) {
        category = "nantun";
        categoryName = "南屯優質";
      } else if (sec.includes("西區")) {
        category = "west";
        categoryName = "西區草悟道";
      } else if (sec.includes("北屯")) {
        category = "beitun";
        categoryName = "北屯機捷";
      } else {
        category = "nationwide";
        categoryName = `${reg}${sec}` || "全台精選";
      }

      let title = (item.address_img || "").trim();
      if (!title || title.length < 4) {
        const alt = item.photo_alt || "";
        const bIdx = alt.indexOf("【");
        title = bIdx >= 0 ? alt.substring(bIdx) : alt;
      }
      title = (title || "").replace(/<[^>]+>/g, "").trim() || `${reg}${sec} 精選好房`;

      const price = String(item.price || "").replace(/萬元|萬/g, "").trim();

      let unitPrice = "";
      const perStr = String(item.perarea_str || "");
      const m = perStr.match(/單價約([\d\.]+)萬/);
      if (m) {
        unitPrice = m[1];
      } else if (item.area && parseFloat(item.area) > 0) {
        try {
          const pVal = parseFloat(price.replace(/,/g, ""));
          const aVal = parseFloat(item.area);
          unitPrice = (pVal / aVal).toFixed(1);
        } catch (e) {}
      }

      const layout = (item.layout || "").replace(/<[^>]+>/g, "").trim() || `${item.room || ""}房`;
      const community = (item.cases_name || "").replace(/<[^>]+>/g, "").trim() || `${reg}${sec}`;
      const street = (item.street_name || "").trim();
      const location = `${reg}${sec} ${street}`.trim();
      const floorInfo = (item.floorInfo || "").replace(/<[^>]+>/g, "").replace("樓層：", "").trim();

      let cover = item.filename || "";
      if (cover) {
        cover = cover.replace("!128x92.jpg", "!800x600.jpg").replace("!200x200.jpg", "!800x600.jpg");
      } else {
        cover = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
      }

      const postId = String(item.id || "");
      const link591 = `https://sale.591.com.tw/home/house/detail/2/${postId}.html`;

      const tags = [];
      if (sec) tags.push(sec);
      if (community && community !== `${reg}${sec}`) tags.push(community);
      const kind = (item.kind_name || "").replace(/<[^>]+>/g, "").trim();
      if (kind) tags.push(kind);
      if (item.houseage && String(item.houseage) !== "0") tags.push(`屋齡${item.houseage}年`);

      properties.push({
        id: idx,
        postId: postId,
        category: category,
        categoryName: categoryName,
        title: title,
        subtitle: `${location}・${community}・${layout}`,
        price: price,
        unitPrice: unitPrice,
        layout: layout,
        area: String(item.area || ""),
        floor: floorInfo,
        age: String(item.houseage || ""),
        community: community,
        location: location,
        tags: tags,
        imageUrl: cover,
        link591: link591,
        isHot: idx <= 6
      });

      idx++;
    }

    return res.status(200).json({
      status: "success",
      total: properties.length,
      updatedAt: new Date().toISOString(),
      data: properties
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
}
