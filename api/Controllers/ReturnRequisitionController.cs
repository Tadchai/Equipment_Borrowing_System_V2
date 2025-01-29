using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using api.Models;
using api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [ApiController]
    [Route("[controller]/[action]")]
    [Authorize]
    public class ReturnRequisitionController : ControllerBase
    {
        private readonly EquipmentBorrowingV2Context _context;

        public ReturnRequisitionController(EquipmentBorrowingV2Context context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReturn([FromBody] CreateReturnAssetRequest request)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var userId = User.FindFirst("userId")?.Value;

                    var instanceModel = await _context.Instances.SingleAsync(i => i.InstanceId == request.InstanceId);
                    var requisitionReturnModel = new RequisitionReturn
                    {
                        ReasonReturn = request.ReasonReturn,
                        Status = ReturnStatus.Pending.ToString(),
                        RequestId = int.Parse(userId)
                    };

                    await _context.RequisitionReturns.AddAsync(requisitionReturnModel);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                    return new JsonResult(new MessageResponse { Message = "Create ReturnAsset successfully.", StatusCode = HttpStatusCode.Created });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return new JsonResult(new MessageResponse { Message = $"An error occurred: {ex.Message}", StatusCode = HttpStatusCode.InternalServerError });
                }
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetReturnList()
        {
            try
            {
                var ReturnAssetList = await (from rt in _context.RequisitionReturns
                                             join rq in _context.RequisitionRequests on rt.RequestId equals rq.RequestId
                                             join z in from i in _context.Instances
                                                       join cs in _context.Classifications on i.ClassificationId equals cs.ClassificationId
                                                       join c in _context.Categories on cs.CategoryId equals c.CategoryId
                                                       select new
                                                       {
                                                           i.InstanceId,
                                                           CategoryName = c.Name,
                                                           ClassificationName = cs.Name,
                                                           i.AssetId
                                                       } on rq.InstanceId equals z.InstanceId into zJoin
                                             from z in zJoin.DefaultIfEmpty()
                                             join u in _context.Users on rq.RequesterId equals u.UserId
                                             select new GetReturnAssetListResponse
                                             {
                                                 Username = u.Username,
                                                 CategoryName = z.CategoryName,
                                                 ClassificationName = z.ClassificationName,
                                                 AssetId = z.AssetId,
                                                 ReasonReturn = rt.ReasonReturn,
                                                 Status = rt.Status,
                                                 InstanceId = z.InstanceId,
                                                 ReturnId = rt.ReturnId
                                             })
                                             .OrderBy(rt => rt.Status != ReturnStatus.Pending.ToString())
                                             .ToListAsync();

                return new JsonResult(ReturnAssetList);
            }
            catch (Exception ex)
            {
                return new JsonResult(new MessageResponse { Message = $"An error occurred: {ex.Message}", StatusCode = HttpStatusCode.InternalServerError });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ConfirmReturn([FromBody] ConfirmReturnAssetRequest request)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var responsibleId = User.FindFirst("userId")?.Value;

                    var instanceModel = await _context.Instances.SingleAsync(i => i.InstanceId == request.InstanceId);
                    instanceModel.RequestId = null;

                    var requisitionReturnModel = await _context.RequisitionReturns.SingleAsync(rt => rt.ReturnId == request.ReturnId);
                    requisitionReturnModel.Status = ReturnStatus.Completed.ToString();
                    requisitionReturnModel.ResponsibleId = int.Parse(responsibleId);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return new JsonResult(new MessageResponse { Message = "Confirm ReturnAsset successfully.", StatusCode = HttpStatusCode.OK });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return new JsonResult(new MessageResponse { Message = $"An error occurred: {ex.Message}", StatusCode = HttpStatusCode.InternalServerError });
                }
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetPendingReturn()
        {
            try
            {
                var pendingReturnList = await (from rt in _context.RequisitionReturns
                                               join rq in _context.RequisitionRequests on rt.RequestId equals rq.RequestId
                                               join z in from i in _context.Instances
                                                         join cs in _context.Classifications on i.ClassificationId equals cs.ClassificationId
                                                         join c in _context.Categories on cs.CategoryId equals c.CategoryId
                                                         select new
                                                         {
                                                             i.InstanceId,
                                                             CategoryName = c.Name,
                                                             ClassificationName = cs.Name,
                                                             i.AssetId
                                                         } on rq.InstanceId equals z.InstanceId into zJoin
                                               from z in zJoin.DefaultIfEmpty()
                                               join u in _context.Users on rq.RequesterId equals u.UserId
                                               where rt.Status == ReturnStatus.Pending.ToString()
                                               select new GetReturnAssetListResponse
                                               {
                                                   Username = u.Username,
                                                   CategoryName = z.CategoryName,
                                                   ClassificationName = z.ClassificationName,
                                                   AssetId = z.AssetId,
                                                   ReasonReturn = rt.ReasonReturn,
                                                   InstanceId = z.InstanceId,
                                                   ReturnId = rt.ReturnId
                                               }).ToListAsync();

                return new JsonResult(pendingReturnList);
            }
            catch (Exception ex)
            {
                return new JsonResult(new MessageResponse { Message = $"An error occurred: {ex.Message}", StatusCode = HttpStatusCode.InternalServerError });
            }
        }
    }
}