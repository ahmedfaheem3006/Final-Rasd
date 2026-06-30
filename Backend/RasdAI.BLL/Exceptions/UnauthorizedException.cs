using System;

namespace RasdAI.BLL.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message) : base(message, 401)
    {
    }
}
