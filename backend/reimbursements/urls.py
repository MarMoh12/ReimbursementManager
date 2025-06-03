from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FundingGroupViewSet,
    ApplicationViewSet,
    ApplicationItemViewSet,
    BudgetEntryViewSet,
    IncomeEntryViewSet,
    CashExpenseEntryViewSet,
    CashIncomeEntryViewSet,
    UserViewSet,
    current_user_view,
)

router = DefaultRouter()
router.register(r'fundinggroups', FundingGroupViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'applicationitems', ApplicationItemViewSet)
router.register(r'budgetentries', BudgetEntryViewSet)
router.register(r'incomeentries', IncomeEntryViewSet)
router.register(r'cashexpenseentries', CashExpenseEntryViewSet)
router.register(r'cashincomeentries', CashIncomeEntryViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('current_user/', current_user_view, name='current-user'),
]
