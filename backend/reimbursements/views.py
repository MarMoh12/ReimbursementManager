from rest_framework import viewsets
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import (
    Application,
    FundingGroup,
    ApplicationItem,
    BudgetEntry,
    IncomeEntry,
    CashExpenseEntry,
    CashIncomeEntry
)
from .serializers import (
    ApplicationSerializer,
    FundingGroupSerializer,
    ApplicationItemSerializer,
    BudgetEntrySerializer,
    IncomeEntrySerializer,
    CashExpenseEntrySerializer,
    CashIncomeEntrySerializer,
    UserSerializer
)

User = get_user_model()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class FundingGroupViewSet(viewsets.ModelViewSet):
    queryset = FundingGroup.objects.all()
    serializer_class = FundingGroupSerializer
    permission_classes = [DjangoModelPermissions]

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [DjangoModelPermissions]

    def get_queryset(self):
        return Application.objects.prefetch_related(
            'items__budget_entry', 'items__funding_group'
        ).select_related('applicant')
    
    def perform_create(self, serializer):
        user = self.request.user
        is_admin = user.is_superuser or user.groups.filter(name='Admin').exists()

        if is_admin:
            serializer.save()
        else:
            # Entferne ggf. unerlaubte applicant-Angabe
            serializer.validated_data.pop('applicant', None)
            serializer.save(applicant=user, submitted_at=timezone.now())
            

    @action(detail=False, methods=['get'], url_path='mine', permission_classes=[IsAuthenticated])
    def mine(self, request):
        queryset = self.get_queryset().filter(applicant=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='available-for-cashbook', permission_classes=[IsAuthenticated])
    def available_for_cashbook(self, request):
        queryset = self.get_queryset().filter(status="genehmigt").exclude(expense_entries__isnull=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ApplicationItemViewSet(viewsets.ModelViewSet):
    queryset = ApplicationItem.objects.all()
    serializer_class = ApplicationItemSerializer
    permission_classes = [DjangoModelPermissions]

class BudgetEntryViewSet(viewsets.ModelViewSet):
    queryset = BudgetEntry.objects.all()
    serializer_class = BudgetEntrySerializer
    permission_classes = [DjangoModelPermissions]

class IncomeEntryViewSet(viewsets.ModelViewSet):
    queryset = IncomeEntry.objects.all()
    serializer_class = IncomeEntrySerializer
    permission_classes = [DjangoModelPermissions]

class CashExpenseEntryViewSet(viewsets.ModelViewSet):
    queryset = CashExpenseEntry.objects.all()
    serializer_class = CashExpenseEntrySerializer
    permission_classes = [DjangoModelPermissions]

class CashIncomeEntryViewSet(viewsets.ModelViewSet):
    queryset = CashIncomeEntry.objects.all()
    serializer_class = CashIncomeEntrySerializer
    permission_classes = [DjangoModelPermissions]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    user = request.user

    if user.is_superuser:
        role = 'superuser'
    elif user.groups.filter(name='Admin').exists():
        role = 'admin'
    elif user.groups.filter(name='User').exists():
        role = 'user'
    else:
        role = 'guest'

    return Response({
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": role,
        "groups": list(user.groups.values_list('name', flat=True)),
        "permissions": list(user.user_permissions.values_list('codename', flat=True)),
    })
