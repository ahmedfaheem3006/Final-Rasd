using System;

namespace RasdAI.BLL.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, 409)
    {
    }
}
