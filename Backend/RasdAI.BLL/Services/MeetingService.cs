using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RasdAI.BLL.DTOs.Meeting;
using RasdAI.BLL.Interfaces;
using RasdAI.DAL;
using RasdAI.DAL.Entities;

namespace RasdAI.BLL.Services;

public class MeetingService : IMeetingService
{
    private readonly AppDbContext _context;

    public MeetingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<MeetingScheduleDto>> GetMeetingsAsync(Guid tenantId)
    {
        return await _context.MeetingSchedules
            .AsNoTracking()
            .Where(m => m.TenantId == tenantId)
            .OrderByDescending(m => m.MeetingDate)
            .Select(m => new MeetingScheduleDto
            {
                Id = m.Id,
                TenantId = m.TenantId,
                Title = m.Title,
                MeetingDate = m.MeetingDate,
                MeetingTime = m.MeetingTime,
                Duration = m.Duration,
                MeetingType = m.MeetingType,
                Location = m.Location,
                Attendees = m.Attendees,
                VirtualLink = m.VirtualLink,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<MeetingScheduleDto> CreateMeetingAsync(CreateMeetingScheduleDto dto, Guid tenantId)
    {
        var meeting = new MeetingSchedule
        {
            TenantId = tenantId,
            Title = dto.Title,
            MeetingDate = dto.MeetingDate,
            MeetingTime = dto.MeetingTime,
            Duration = dto.Duration,
            MeetingType = dto.MeetingType,
            Location = dto.Location,
            Attendees = dto.Attendees,
            VirtualLink = dto.VirtualLink,
            CreatedAt = DateTime.UtcNow
        };

        _context.MeetingSchedules.Add(meeting);
        await _context.SaveChangesAsync();

        return new MeetingScheduleDto
        {
            Id = meeting.Id,
            TenantId = meeting.TenantId,
            Title = meeting.Title,
            MeetingDate = meeting.MeetingDate,
            MeetingTime = meeting.MeetingTime,
            Duration = meeting.Duration,
            MeetingType = meeting.MeetingType,
            Location = meeting.Location,
            Attendees = meeting.Attendees,
            VirtualLink = meeting.VirtualLink,
            CreatedAt = meeting.CreatedAt
        };
    }

    public async Task<MeetingScheduleDto?> UpdateMeetingAsync(int id, CreateMeetingScheduleDto dto, Guid tenantId)
    {
        var meeting = await _context.MeetingSchedules
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (meeting == null) return null;

        meeting.Title = dto.Title;
        meeting.MeetingDate = dto.MeetingDate;
        meeting.MeetingTime = dto.MeetingTime;
        meeting.Duration = dto.Duration;
        meeting.MeetingType = dto.MeetingType;
        meeting.Location = dto.Location;
        meeting.Attendees = dto.Attendees;
        meeting.VirtualLink = dto.VirtualLink;

        await _context.SaveChangesAsync();

        return new MeetingScheduleDto
        {
            Id = meeting.Id,
            TenantId = meeting.TenantId,
            Title = meeting.Title,
            MeetingDate = meeting.MeetingDate,
            MeetingTime = meeting.MeetingTime,
            Duration = meeting.Duration,
            MeetingType = meeting.MeetingType,
            Location = meeting.Location,
            Attendees = meeting.Attendees,
            VirtualLink = meeting.VirtualLink,
            CreatedAt = meeting.CreatedAt
        };
    }

    public async Task<bool> DeleteMeetingAsync(int id, Guid tenantId)
    {
        var meeting = await _context.MeetingSchedules
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);

        if (meeting == null) return false;

        _context.MeetingSchedules.Remove(meeting);
        await _context.SaveChangesAsync();
        return true;
    }
}
