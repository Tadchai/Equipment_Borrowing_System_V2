import { API_URL, RequestStatus } from "/Frontend/assets/config.js";

document.getElementById("ToManageAssetInSystemPage").addEventListener("click", async () =>
{
  window.location.href = "/Frontend/ManageAssetInSystem.html"
});
document.getElementById("ToManageRequestReturnPage").addEventListener("click", async () =>
{
  window.location.href = "/Frontend/ManageRequestReturn.html"
});
document.getElementById("ToOverviewAssetPage").addEventListener("click", async () =>
{
  window.location.href = "/Frontend/OverviewAsset.html"
});
document.getElementById("ToLoginPage").addEventListener("click", async () =>
{
  localStorage.removeItem('token');
  const logoutUrl = `http://localhost:8080/realms/Requisition/protocol/openid-connect/logout`;
  window.location.href = logoutUrl;
  window.location.href = "/Frontend/login.html"
});

document.getElementById("assets").addEventListener("click", async () =>
{
  fetchGetUserAsset()
});

document.getElementById("request").addEventListener("click", async () =>
{
  fetchGetRequest()
});
document.getElementById("Confirm").addEventListener("click", async () =>
{
  fetchGetConfirmList()
});

function padNumber(id, length)
{
  return id.toString().padStart(length, '0');
}

let pageSize = 10;
let PreviousCursor = null;
let NextCursor = null;
let TotalRow = 0;
function search(fetchFunction)
{
  fetchFunction(null, null);
}
function nextPage(fetchFunction)
{
  fetchFunction(null, NextCursor);
}
function previousPage(fetchFunction)
{
  fetchFunction(PreviousCursor, null);
}
function updatePaginationControls(fetchFunction)
{
  document.getElementById("prevBtn").onclick = () => previousPage(fetchFunction);
  document.getElementById("nextBtn").onclick = () => nextPage(fetchFunction);

  document.getElementById("pageSizeSelect").value = pageSize;
}
function changePageSize(newSize, fetchFunction)
{
  pageSize = newSize;
  fetchFunction();
}
function updatePage(result)
{
  document.getElementById("TotalRow").innerText = result.totalRow ?? 0
  document.getElementById("TotalBefore").innerText = result.totalBefore ?? 0
  document.getElementById("TotalAfter").innerText = result.totalAfter ?? 0
  document.getElementById("RowCountDisplay").innerText = result.itemTotal ?? 0
  document.getElementById("nextBtn").disabled = result.totalAfter === 0;
  document.getElementById("prevBtn").disabled = result.totalBefore === 0;
}

async function fetchGetUserAsset(previousCursor, nextCursor)
{
  try
  {
    const token = localStorage.getItem("token");

    const requestBody = {
      PageSize: pageSize,
      PreviousCursor: previousCursor,
      NextCursor: nextCursor,
    };

    const body = JSON.stringify(requestBody, (key, value) => (value === "" ? null : value));

    const response = await fetch(`${API_URL}/RequestRequisition/GetUserAsset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: body
    });
    const result = await response.json();

    TotalRow = result.totalRow;
    PreviousCursor = result.previousCursor;
    NextCursor = result.nextCursor;

    displayAssets(result.data);
    updatePaginationControls(fetchGetUserAsset);
    updatePage(result)

  } catch (error)
  {
    console.error("Error:", error);
  }
}

async function fetchGetRequest(previousCursor, nextCursor)
{
  try
  {
    const token = localStorage.getItem("token");

    const requestBody = {
      PageSize: pageSize,
      PreviousCursor: previousCursor,
      NextCursor: nextCursor,
      categoryName: document.getElementById("categoryName")?.value,
      status: document.getElementById("status")?.value,
      dueDate: document.getElementById("dueDate")?.value
    };

    const body = JSON.stringify(requestBody, (key, value) => (value === "" ? null : value));
    
    const response = await fetch(`${API_URL}/RequestRequisition/GetRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: body
    });
    const result = await response.json();

    TotalRow = result.totalRow;
    PreviousCursor = result.previousCursor;
    NextCursor = result.nextCursor;

    displayRequest(result.data);
    updatePaginationControls(fetchGetRequest);
    updatePage(result)

  } catch (error)
  {
    console.error("Error:", error);
  }
}

async function fetchGetConfirmList(previousCursor, nextCursor)
{
  try
  {
    const token = localStorage.getItem("token");

    const requestBody = {
      PageSize: pageSize,
      PreviousCursor: previousCursor,
      NextCursor: nextCursor,
    };

    const body = JSON.stringify(requestBody, (key, value) => (value === "" ? null : value));

    const response = await fetch(`${API_URL}/RequestRequisition/GetConfirmList`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: body
    });
    const result = await response.json();
    TotalRow = result.totalRow;
    PreviousCursor = result.previousCursor;
    NextCursor = result.nextCursor;

    displayConfirm(result.data);
    updatePaginationControls(fetchGetConfirmList);
    updatePage(result)

  } catch (error)
  {
    console.error("Error:", error);
  }
}


function displayAssets(data)
{
  const container = document.getElementById("asset-container");
  container.innerHTML = `
  <div class="table-header">รายการทรัพย์สินที่ถือครอง</div>

<div class="table-controls">
  <span>ข้อมูลทั้งหมด: <span id="RowCountDisplay">0</span> รายการ</span>
  
  <div class="page-size">
    <label for="pageSizeSelect">จำนวนต่อหน้า:</label>
    <select id="pageSizeSelect" onchange="changePageSize(Number(this.value), fetchGetUserAsset)">
      <option value="3">3</option>
      <option value="7">7</option>
      <option value="10" selected>10</option>
    </select>
  </div>
</div>
  `;

  if (data == null || data.length === 0)
  {
    container.innerHTML += `<p style="text-align: center;">ไม่มีทรัพย์สินที่ถืออยู่</p>`;
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
  <thead>
    <tr>
      <th>ลำดับที่</th>
      <th>หมวดหมู่ของทรัพย์สิน</th>
      <th>การจำแนกทรัพย์สิน</th>
      <th>รหัสทรัพย์สิน</th>
    </tr>
  </thead>
  <tbody>
    ${data
      .map(
        (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.categoryName}</td>
        <td>${item.classificationName}</td>
        <td>${item.assetId}</td>
      </tr>
    `
      )
      .join("")}
  </tbody>
`;

  container.appendChild(table);
}

function displayRequest(data)
{
  const container = document.getElementById("asset-container");

  const filters = {
    categoryName: document.getElementById("categoryName")?.value || "",
    dueDate: document.getElementById("dueDate")?.value || "",
    status: document.getElementById("status")?.value || "",
  };

  container.innerHTML =
    `
<div class="table-header">
  <h2>รายการใบคำขออนุมัติการเบิก</h2>
  <button id="openRequisitionModalBtn">สร้างใบคำขออนุมัติการเบิก</button>
</div>

<div class="table-controls">
  <span>ข้อมูลทั้งหมด: <span id="RowCountDisplay">0</span> รายการ</span>
  
  <div class="page-size">
    <label for="pageSizeSelect">จำนวนต่อหน้า:</label>
    <select id="pageSizeSelect" onchange="changePageSize(Number(this.value), fetchGetRequest)">
      <option value="3">3</option>
      <option value="7">7</option>
      <option value="10" selected>10</option>
    </select>
  </div>
</div>

<div>
        <label for="categoryName">หมวดหมู่:</label>
        <input type="text" id="categoryName" name="categoryName">
        <label for="dueDate">วันที่:</label>
        <input type="date" id="dueDate" name="dueDate">
        <label for="status">สถานะ:</label>
        <select name="status" id="status">
          <option value="">-</option>
          <option value="0">Pending</option>
          <option value="1">Allocated</option>
          <option value="2">Rejected</option>
          <option value="3">Completed</option>
        </select>
        <button onclick="search(fetchGetRequest)">ค้นหา</button>
    </div>
`;

  document.getElementById("categoryName").value = filters.categoryName;
  document.getElementById("dueDate").value = filters.dueDate;
  document.getElementById("status").value = filters.status;

if (data == null || data.length === 0)
  {
    container.innerHTML += `<p style="text-align: center;">ไม่มีใบคำขออนุมัติการเบิก</p>`;
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
      <thead>
        <tr>
          <th>ใบขอเบิกลำดับที่</th>
          <th>หมวดหมู่ของทรัพย์สิน</th>
          <th>คุณสมบัติที่ต้องการ</th>
          <th>วันที่ต้องการใช้งาน </th>
          <th>เหตุผลในการขอเบิก</th>
          <th>สถานะคำร้อง</th>
          <th>รหัสทรัพย์สิน</th>
          <th>เหตุผลในการปฏิเสธ</th>
        </tr>
      </thead>
      <tbody>
        ${data
      .map(
        (item) => `
          <tr>
            <td>${padNumber(item.requestId, 5)}</td>
            <td>${item.categoryName}</td>
            <td>${item.requirement}</td>
            <td>${item.dueDate}</td>
            <td>${item.reasonRequest}</td>
            <td>${RequestStatus[item.status] || '-'}</td>
            <td>${item.assetId || '-'}</td>
            <td>${item.reasonRejected || '-'}</td>
          </tr>
        `
      )
      .join("")}
      </tbody>
    `;

  container.appendChild(table);

  const openRequisitionModalBtn = document.getElementById("openRequisitionModalBtn");
  openRequisitionModalBtn.addEventListener("click", async () =>
  {
    requisitionModal.style.display = "flex";
    loadCategoriesRequisition();
  });


  const closeRequisitionModalBtn = document.getElementById("closeRequisitionModalBtn");
  closeRequisitionModalBtn.addEventListener("click", () =>
  {
    requisitionModal.style.display = "none";
  });

  submitRequisitionBtn.addEventListener('click', async () =>
  {
    const selectedAsset = assetSelectRequisition.value;
    const returnMessage = document.getElementById('returnMessageRequisition').value;
    const resonMessage = document.getElementById('reasonMessageRequisition').value;
    const dueDate = document.getElementById('dateSelectRequisition').value;

    const requestData = {
      CategoryId: parseInt(selectedAsset),
      Requirement: returnMessage,
      ReasonRequest: resonMessage,
      DueDate: dueDate
    };

    try
    {
      let token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/RequestRequisition/CreateRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.statusCode == 201)
      {
        requisitionModal.style.display = "none";
        fetchGetRequest()
        alert(result.message);
      } else
      {
        alert(result.message || "กรอกข้อมูลไม่ครบ");
      }
    } catch (error)
    {
      console.error('Error sending data to API:', error);
    }
  });
}

function displayConfirm(data)
{
  const container = document.getElementById("asset-container");
  container.innerHTML = `
  <div class="table-header">รายการยืนยันการได้รับทรัพย์สิน</div>

<div class="table-controls">
  <span>ข้อมูลทั้งหมด: <span id="RowCountDisplay">0</span> รายการ</span>
  
  <div class="page-size">
    <label for="pageSizeSelect">จำนวนต่อหน้า:</label>
    <select id="pageSizeSelect" onchange="changePageSize(Number(this.value), fetchGetConfirmList)">
      <option value="3">3</option>
      <option value="7">7</option>
      <option value="10" selected>10</option>
    </select>
  </div>
</div>
  `;

  if (data == null || data.length === 0)
  {
    container.innerHTML += `<p style="text-align: center;">ไม่มีรายการยืนยันการได้รับทรัพย์สิน</p>`;
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
  <thead>
    <tr>
        <th>ลำดับที่</th>
        <th>หมวดหมู่ของทรัพย์สิน</th>
        <th>การจำแนกประเภทของทรัพย์สิน</th>
        <th>รหัสทรัพย์สิน</th>
        <th>ยืนยันการได้รับ</th> 
    </tr>
  </thead>
  <tbody>
    ${data
      .map(
        (item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.categoryName}</td>
            <td>${item.classificationName}</td>
            <td>${item.assetId}</td>
            <td><button class="btn-confirm" onclick="confirmAction(${item.requestId})">ยืนยัน</button></td> 
        </tr>
    `
      )
      .join("")}
  </tbody>
`;

  container.appendChild(table);
}



const returnAssetModal = document.getElementById("returnAssetModal");

document.getElementById("openReturnAssetModalBtn").addEventListener("click", async () =>
{
  returnAssetModal.style.display = "flex";

  try
  {
    let token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/RequestRequisition/GetUserAsset`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();

    if (response.ok)
    {
      const assetSelect = document.getElementById("assetSelect");
      assetSelect.innerHTML = '<option value="">-- กรุณาเลือกทรัพย์สิน --</option>';
      data.forEach((item) =>
      {
        const option = document.createElement("option");
        option.value = item.instanceId;
        option.textContent = `${item.categoryName} - ${item.classificationName} (${item.assetId})`;
        assetSelect.appendChild(option);
      });
    } else
    {
      alert(data.Message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  } catch (error)
  {
    console.error("Error fetching asset list:", error);
    alert("ไม่สามารถเชื่อมต่อกับ API ได้");
  }
});

document.getElementById("closeReturnAssetModalBtn").addEventListener("click", () =>
{
  returnAssetModal.style.display = "none";
});

submitReturnBtn.addEventListener('click', async () =>
{
  const selectedAsset = assetSelect.value;
  const returnMessage = document.getElementById('returnMessage').value;

  const requestData = {
    InstanceId: parseInt(selectedAsset),
    ReasonReturn: returnMessage
  };

  try
  {
    let token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/ReturnRequisition/CreateReturn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();

    if (response.status == 200)
    {
      returnAssetModal.style.display = 'none';
      alert(result.message || 'ส่งข้อมูลสำเร็จ');
    } else
    {
      alert(result.message || 'กรอกข้อมูลไม่ครบ');
    }
  } catch (error)
  {
    console.error('Error sending data to API:', error);
  }
});

async function loadCategoriesRequisition()
{
  try
  {
    let token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/Item/GetCategory`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();

    const assetSelectRequisition = document.getElementById("assetSelectRequisition");
    assetSelectRequisition.innerHTML = '<option value="">-- กรุณาเลือกทรัพย์สิน --</option>';
    data.forEach(item =>
    {
      const option = document.createElement("option");
      option.value = item.categoryId;
      option.textContent = item.categoryName;
      assetSelectRequisition.appendChild(option);
    });
  } catch (error)
  {
    console.error('Error fetching category data:', error);
  }
}

window.addEventListener("click", (event) =>
{
  if (event.target === returnAssetModal)
  {
    returnAssetModal.style.display = "none";
  }
  if (event.target === requisitionModal)
  {
    requisitionModal.style.display = "none";
  }
});

async function confirmAction(requestId)
{
  const confirmData = { RequestId: requestId };

  try
  {
    let token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/RequestRequisition/ConfirmRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(confirmData),
    });

    const result = await response.json();

    if (response.ok)
    {
      alert(result.message || "ยืนยันการรับทรัพย์สินสำเร็จ");
      fetchGetConfirmList()
    } else
    {
      alert(resultmessage || "เกิดข้อผิดพลาดในการยืนยัน");
    }
  } catch (error)
  {
    console.error("Error confirming request:", error);
    alert("ไม่สามารถเชื่อมต่อกับ API ได้");
  }
}


window.confirmAction = confirmAction;
window.changePageSize = changePageSize;
window.fetchGetUserAsset = fetchGetUserAsset;
window.fetchGetRequest = fetchGetRequest;
window.fetchGetConfirmList = fetchGetConfirmList;
window.search = search;


fetchGetUserAsset();